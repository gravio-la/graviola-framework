import {
  hasCapabilityInDescriptor,
  type BaseStore,
  type CapabilityName,
  type SchemaRegistry,
} from "@graviola/store-core";

import {
  commandCapability,
  decodeStorePath,
  enrichCommandFromBody,
  encodeCommandResult,
  problemResponse,
  type CommandContext,
  type CommandInterceptor,
  type ExtensionRoute,
  type HttpMiddleware,
  type StoreCommand,
} from "./commands.js";
import {
  computeHandshake,
  DEFAULT_HANDSHAKE_PATH,
  matchExtensionRoute,
  normalizeBasePath,
  stripBasePath,
  type GraviolaAuthMode,
  type GraviolaIriHandlingMode,
  type GraviolaStoreHandshakeResponse,
} from "./handshake.js";

export type StoreRestHandler = (req: Request) => Promise<Response | null>;

export type AuthConfig = {
  modes: GraviolaAuthMode[];
  apiKeyHeader?: string;
  verify?: (
    req: Request,
  ) => Promise<{ ok: true; principal?: unknown } | { ok: false }>;
};

export type CreateStoreRestHandlerOptions<R extends SchemaRegistry> = {
  store: BaseStore<R> & Record<string, unknown>;
  /** Logical type names exposed on the wire (see Identifies.typeNameToTypeIRI). */
  typeNames: string[];
  basePath?: string;
  handshakePath?: string;
  iriHandling?: GraviolaIriHandlingMode[];
  localIdToIri?: (typeName: string, localId: string) => string;
  auth?: AuthConfig;
  pagination?: { maxLimit?: number };
  middleware?: HttpMiddleware[];
  interceptors?: CommandInterceptor<R>[];
  routes?: ExtensionRoute[];
};

const composeMiddleware = (
  middlewares: HttpMiddleware[],
  terminal: (req: Request, ctx: CommandContext) => Promise<Response>,
): ((req: Request, ctx: CommandContext) => Promise<Response>) => {
  return async (req: Request, ctx: CommandContext): Promise<Response> => {
    let index = 0;
    const dispatch = async (): Promise<Response> => {
      if (index >= middlewares.length) return terminal(req, ctx);
      const mw = middlewares[index++];
      return mw(req, ctx, dispatch);
    };
    return dispatch();
  };
};

const composeInterceptors = <R extends SchemaRegistry>(
  interceptors: CommandInterceptor<R>[],
  terminal: (cmd: StoreCommand<R>) => Promise<unknown>,
): ((cmd: StoreCommand<R>, ctx: CommandContext) => Promise<unknown>) => {
  return async (
    cmd: StoreCommand<R>,
    ctx: CommandContext,
  ): Promise<unknown> => {
    let index = 0;
    const dispatch = async (c: StoreCommand<R>): Promise<unknown> => {
      if (index >= interceptors.length) return terminal(c);
      const interceptor = interceptors[index++];
      return interceptor(c, ctx, dispatch);
    };
    return dispatch(cmd);
  };
};

const executeOnStore = async (
  store: Record<string, unknown>,
  cmd: StoreCommand,
): Promise<unknown> => {
  switch (cmd.kind) {
    case "loadOne": {
      if (
        cmd.materialized &&
        cmd.withMeta &&
        typeof store.readCalcValues === "function"
      ) {
        const result = (await (store.readCalcValues as Function)(
          cmd.entityIRI,
        )) as { value: Record<string, unknown> | null; freshness: string };
        if (result.value == null) return null;
        return {
          data: result.value,
          provenance: {
            sources: [store.storeId ?? "unknown"],
            fetchedAt: new Date().toISOString(),
            freshness: result.freshness,
          },
        };
      }
      if (cmd.withMeta) {
        return (store.loadOne as Function)(cmd.typeName, cmd.entityIRI, {
          withMeta: true,
        });
      }
      return (store.loadOne as Function)(cmd.typeName, cmd.entityIRI);
    }
    case "exists":
      return (store.exists as Function)(cmd.typeName, cmd.entityIRI);
    case "list":
      return (store.list as Function)(cmd.typeName, cmd.limit, cmd.query);
    case "filterMany":
      return (store.filterMany as Function)(cmd.typeName, cmd.options);
    case "filterOne": {
      const filterOne = store.filterOne as Function | undefined;
      if (typeof filterOne === "function") {
        return filterOne(cmd.typeName, cmd.entityIRI, cmd.options);
      }
      // Fallback: filterMany with @id equals + limit 1
      const rows = await (store.filterMany as Function)(cmd.typeName, {
        ...cmd.options,
        where: {
          ...((cmd.options?.where as object) ?? {}),
          "@id": { equals: cmd.entityIRI },
        },
        limit: 1,
      });
      return Array.isArray(rows) ? (rows[0] ?? null) : null;
    }
    case "count":
      return (store.count as Function)(cmd.typeName, {
        search: cmd.search,
        insensitive: cmd.insensitive,
      });
    case "search":
      if (cmd.mode === "entity_rows") {
        return (store.findEntityByTypeName as Function)(
          cmd.typeName,
          cmd.text,
          cmd.limit,
        );
      }
      return (store.searchByLabel as Function)(
        cmd.typeName,
        cmd.text,
        cmd.limit,
      );
    case "findByAuthority": {
      const finder = (
        store as {
          findDocumentsByAuthorityIRI?: (
            typeName: string,
            authorityIRI: string,
            repositoryIRI?: string,
            limit?: number,
          ) => Promise<unknown[]>;
        }
      ).findDocumentsByAuthorityIRI;
      if (typeof finder !== "function") {
        throw Object.assign(
          new Error("findDocumentsByAuthorityIRI not implemented"),
          { status: 501, code: "capability_not_supported" },
        );
      }
      return finder(
        cmd.typeName,
        cmd.authorityIRI,
        cmd.repositoryIRI,
        cmd.limit,
      );
    }
    case "upsert":
      return (store.upsert as Function)(
        cmd.typeName,
        cmd.entityIRI,
        cmd.document,
      );
    case "remove":
      return (store.remove as Function)(cmd.typeName, cmd.entityIRI);
    case "resolveTypes":
      return (store.resolveTypes as Function)(cmd.entityIRI);
    case "writeStatements":
      return (store.writeStatements as Function)(
        cmd.typeName,
        cmd.entityIRI,
        cmd.writes,
      );
    case "loadStatements":
      return (store.loadStatements as Function)(
        cmd.typeName,
        cmd.entityIRI,
        cmd.paths,
      );
    case "calcWarm":
      return (store.calcWarm as Function)(cmd.rootIRIs, {
        skipFresh: cmd.skipFresh,
      });
    case "entitiesWithClasses": {
      const fn = store.getEntitiesWithClassesByFilter;
      if (typeof fn !== "function") {
        throw Object.assign(
          new Error("getEntitiesWithClassesByFilter not implemented"),
          { status: 501, code: "capability_not_supported" },
        );
      }
      return (fn as Function)(cmd.options);
    }
    default:
      throw new Error("Unhandled command");
  }
};

const verifyAuth = async (
  req: Request,
  auth: AuthConfig | undefined,
  ctx: CommandContext,
): Promise<Response | null> => {
  if (!auth?.verify) return null;
  const result = await auth.verify(req);
  if (!result.ok) {
    return problemResponse(401, "auth_required", "Authentication required");
  }
  if (result.principal !== undefined) {
    ctx.locals.principal = result.principal;
  }
  return null;
};

export const createStoreRestHandler = <R extends SchemaRegistry>(
  opts: CreateStoreRestHandlerOptions<R>,
): StoreRestHandler => {
  const basePath = normalizeBasePath(opts.basePath ?? "/api/graviola");
  const handshakePath = opts.handshakePath ?? DEFAULT_HANDSHAKE_PATH;
  const iriHandling = opts.iriHandling ?? ["fullIRI"];
  const middlewares = opts.middleware ?? [];
  const interceptors = opts.interceptors ?? [];
  const extensionRoutes = opts.routes ?? [];
  const typeNames = opts.typeNames;
  const store = opts.store;

  const handshakeBody: GraviolaStoreHandshakeResponse = computeHandshake(
    store.capabilities,
    store,
    {
      basePath,
      typeNames,
      iriHandling,
      auth: opts.auth
        ? { modes: opts.auth.modes, apiKeyHeader: opts.auth.apiKeyHeader }
        : undefined,
      pagination: opts.pagination,
      idempotency: { supported: true, windowSeconds: 86400 },
    },
  );

  const runCommand = composeInterceptors(interceptors, (cmd) =>
    executeOnStore(store as Record<string, unknown>, cmd),
  );

  const handleStoreRequest = async (
    req: Request,
    ctx: CommandContext,
  ): Promise<Response> => {
    const url = new URL(req.url);
    const relative = stripBasePath(url.pathname, basePath);
    if (relative == null) {
      return problemResponse(404, "not_found", "Route not found");
    }

    const extMatch = matchExtensionRoute(req.method, relative, extensionRoutes);
    if (extMatch) {
      return extMatch.route.handler(req, extMatch.params, ctx);
    }

    const decoded = decodeStorePath(req.method, relative, req, {
      typeNames,
      iriHandling,
      localIdToIri: opts.localIdToIri,
      maxLimit: opts.pagination?.maxLimit,
    });

    if (decoded === null) {
      return problemResponse(404, "not_found", "Route not found");
    }
    if (decoded === "unknown_type") {
      return problemResponse(404, "unknown_type", "Unknown type name");
    }

    let cmd = decoded;
    if (
      cmd.kind === "filterMany" ||
      cmd.kind === "filterOne" ||
      cmd.kind === "count" ||
      cmd.kind === "search" ||
      cmd.kind === "upsert" ||
      cmd.kind === "entitiesWithClasses" ||
      cmd.kind === "writeStatements" ||
      cmd.kind === "loadStatements" ||
      cmd.kind === "calcWarm"
    ) {
      cmd = await enrichCommandFromBody(cmd, req);
    }

    const cap = commandCapability(cmd) as CapabilityName;
    if (!hasCapabilityInDescriptor(store.capabilities, cap)) {
      return problemResponse(
        501,
        "capability_not_supported",
        `Capability ${cap} not supported`,
      );
    }

    try {
      const result = await runCommand(cmd as StoreCommand<R>, ctx);
      return encodeCommandResult(cmd, result);
    } catch (err) {
      const e = err as { status?: number; code?: string; message?: string };
      if (e?.status === 501) {
        return problemResponse(
          501,
          e.code ?? "capability_not_supported",
          e.message ?? "Capability not supported",
        );
      }
      throw err;
    }
  };

  const pipeline = composeMiddleware(middlewares, (req, ctx) =>
    handleStoreRequest(req, ctx),
  );

  return async (req: Request): Promise<Response | null> => {
    const url = new URL(req.url);
    const normalizedHandshake = normalizeBasePath(handshakePath);

    if (
      req.method === "GET" &&
      (url.pathname === normalizedHandshake ||
        url.pathname === DEFAULT_HANDSHAKE_PATH)
    ) {
      return new Response(JSON.stringify(handshakeBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const relative = stripBasePath(url.pathname, basePath);
    if (relative == null && url.pathname !== normalizedHandshake) {
      return null;
    }

    const ctx: CommandContext = {
      request: req,
      store,
      basePath,
      locals: {},
    };

    const authFailure = await verifyAuth(req, opts.auth, ctx);
    if (authFailure) return authFailure;

    if (relative == null) return null;

    return pipeline(req, ctx);
  };
};
