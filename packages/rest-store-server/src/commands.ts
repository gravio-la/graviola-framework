import type {
  BaseStore,
  SchemaRegistry,
  StoreDocumentsSearchOptions,
  StoreListQuery,
} from "@graviola/store-core";
import type { StatementWrite } from "@graviola/provenance-types";

/** MIME negotiation for ReadResult envelope (v1 wire contract). */
export const GRAVIOLA_STORE_ENVELOPE_ACCEPT =
  "application/vnd.graviola-store.envelope+json";

export type StoreCommand<R extends SchemaRegistry = SchemaRegistry> =
  | {
      kind: "loadOne";
      typeName: keyof R & string;
      entityIRI: string;
      withMeta: boolean;
    }
  | { kind: "exists"; typeName: string; entityIRI: string }
  | {
      kind: "list";
      typeName: string;
      limit?: number;
      offset?: number;
      query?: StoreListQuery;
    }
  | {
      kind: "filterMany";
      typeName: string;
      options: StoreDocumentsSearchOptions<unknown>;
    }
  | {
      kind: "filterOne";
      typeName: string;
      entityIRI: string;
      options: StoreDocumentsSearchOptions<unknown>;
    }
  | {
      kind: "count";
      typeName: string;
      search?: string;
      insensitive?: boolean;
    }
  | {
      kind: "search";
      typeName: string;
      text: string;
      limit?: number;
      mode?: "typed" | "entity_rows";
    }
  | { kind: "upsert"; typeName: string; entityIRI: string; document: unknown }
  | { kind: "remove"; typeName: string; entityIRI: string }
  | { kind: "resolveTypes"; entityIRI: string }
  | {
      kind: "entitiesWithClasses";
      options: StoreDocumentsSearchOptions<unknown>;
    }
  | {
      kind: "writeStatements";
      typeName: string;
      entityIRI: string;
      writes: StatementWrite[];
    }
  | {
      kind: "loadStatements";
      typeName: string;
      entityIRI: string;
      paths?: string[];
    }
  | { kind: "calcWarm"; rootIRIs?: string[]; skipFresh?: boolean };

export type CommandContext = {
  request: Request;
  store: BaseStore<SchemaRegistry>;
  basePath: string;
  locals: Record<string, unknown>;
};

export type CommandInterceptor<R extends SchemaRegistry = SchemaRegistry> = (
  cmd: StoreCommand<R>,
  ctx: CommandContext,
  next: (cmd: StoreCommand<R>) => Promise<unknown>,
) => Promise<unknown>;

export type HttpMiddleware = (
  req: Request,
  ctx: CommandContext,
  next: (req: Request) => Promise<Response>,
) => Promise<Response>;

export type ExtensionRoute = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** path relative to basePath, ":param" segments supported */
  path: string;
  handler: (
    req: Request,
    params: Record<string, string>,
    ctx: CommandContext,
  ) => Promise<Response>;
};

export type DecodePathContext = {
  typeNames: string[];
  iriHandling: ("fullIRI" | "localId")[];
  localIdToIri?: (typeName: string, localId: string) => string;
  maxLimit?: number;
};

const decodePathSegment = (segment: string): string =>
  decodeURIComponent(segment);

const parseSortParam = (
  sort: string | null,
): { id: string; desc?: boolean }[] | undefined => {
  if (!sort) return undefined;
  return sort.split(",").map((part) => {
    const [id, dir] = part.split(":");
    return { id, desc: dir === "desc" };
  });
};

const clampLimit = (
  limit: number | undefined,
  maxLimit: number | undefined,
): number | undefined => {
  if (limit == null) return undefined;
  if (maxLimit != null && limit > maxLimit) return maxLimit;
  return limit;
};

const decodeEntityIri = (
  typeName: string,
  segment: string,
  ctx: DecodePathContext,
): string => {
  const localId = decodePathSegment(segment);
  if (ctx.iriHandling.includes("localId") && ctx.localIdToIri) {
    return ctx.localIdToIri(typeName, localId);
  }
  return localId;
};

const isKnownType = (typeName: string, typeNames: string[]): boolean =>
  typeNames.includes(typeName);

export const acceptsEnvelope = (req: Request): boolean => {
  const accept = req.headers.get("Accept") ?? "";
  return accept.includes(GRAVIOLA_STORE_ENVELOPE_ACCEPT);
};

/**
 * Decode a store-relative path (after basePath strip) into a command, or null if unmatched.
 */
export const decodeStorePath = (
  method: string,
  relativePath: string,
  req: Request,
  ctx: DecodePathContext,
): StoreCommand | "unknown_type" | null => {
  const trimmed = relativePath.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!trimmed) return null;

  const segments = trimmed.split("/").filter(Boolean);

  if (segments[0] === "_resolve-types" && method === "GET") {
    const url = new URL(req.url);
    const entityIRI = url.searchParams.get("entityIRI");
    if (!entityIRI) return null;
    return { kind: "resolveTypes", entityIRI };
  }

  if (
    segments[0] === "_entities-with-classes" &&
    method === "POST" &&
    segments.length === 1
  ) {
    return { kind: "entitiesWithClasses", options: {} };
  }

  if (
    segments[0] === "_calc" &&
    segments[1] === "warm" &&
    segments.length === 2 &&
    method === "POST"
  ) {
    return { kind: "calcWarm" };
  }

  const typeName = decodePathSegment(segments[0]);
  if (!isKnownType(typeName, ctx.typeNames)) {
    return "unknown_type";
  }

  if (segments.length === 2 && segments[1] === "_query" && method === "POST") {
    return { kind: "filterMany", typeName, options: {} };
  }

  // POST /{typeName}/{id}/_query → filterOne
  if (segments.length === 3 && segments[2] === "_query" && method === "POST") {
    const entityIRI = decodeEntityIri(typeName, segments[1], ctx);
    return { kind: "filterOne", typeName, entityIRI, options: {} };
  }

  // PUT /{typeName}/{id}/_statements → writeStatements
  if (
    segments.length === 3 &&
    segments[2] === "_statements" &&
    method === "PUT"
  ) {
    const entityIRI = decodeEntityIri(typeName, segments[1], ctx);
    return { kind: "writeStatements", typeName, entityIRI, writes: [] };
  }

  // POST /{typeName}/{id}/_statements/query → loadStatements
  if (
    segments.length === 4 &&
    segments[2] === "_statements" &&
    segments[3] === "query" &&
    method === "POST"
  ) {
    const entityIRI = decodeEntityIri(typeName, segments[1], ctx);
    return { kind: "loadStatements", typeName, entityIRI };
  }

  if (segments.length === 2 && segments[1] === "_count" && method === "POST") {
    return { kind: "count", typeName };
  }

  if (segments.length === 2 && segments[1] === "_search" && method === "POST") {
    return { kind: "search", typeName, text: "" };
  }

  if (segments.length === 2) {
    const entityIRI = decodeEntityIri(typeName, segments[1], ctx);
    switch (method) {
      case "GET":
        return {
          kind: "loadOne",
          typeName,
          entityIRI,
          withMeta: acceptsEnvelope(req),
        };
      case "HEAD":
        return { kind: "exists", typeName, entityIRI };
      case "PUT":
        return { kind: "upsert", typeName, entityIRI, document: null };
      case "DELETE":
        return { kind: "remove", typeName, entityIRI };
      default:
        return null;
    }
  }

  if (segments.length === 1 && method === "GET") {
    const url = new URL(req.url);
    const limitRaw = url.searchParams.get("limit");
    const offsetRaw = url.searchParams.get("offset");
    const limit = clampLimit(
      limitRaw != null ? Number(limitRaw) : undefined,
      ctx.maxLimit,
    );
    const offset = offsetRaw != null ? Number(offsetRaw) : undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const insensitiveParam = url.searchParams.get("insensitive");
    const insensitive =
      insensitiveParam == null ? undefined : insensitiveParam !== "false";
    const sorting = parseSortParam(url.searchParams.get("sort"));
    const query: StoreListQuery = {
      ...(search != null ? { search } : {}),
      ...(insensitive !== undefined ? { insensitive } : {}),
      ...(sorting?.length ? { sorting } : {}),
      ...(limit != null || offset != null
        ? {
            pagination: {
              pageSize: limit ?? 50,
              pageIndex:
                offset != null && limit != null && limit > 0
                  ? Math.floor(offset / limit)
                  : 0,
            },
          }
        : {}),
    };
    return {
      kind: "list",
      typeName,
      limit,
      offset,
      query: Object.keys(query).length ? query : undefined,
    };
  }

  return null;
};

export const enrichCommandFromBody = async (
  cmd: StoreCommand,
  req: Request,
): Promise<StoreCommand> => {
  if (
    cmd.kind === "filterMany" ||
    cmd.kind === "filterOne" ||
    cmd.kind === "count" ||
    cmd.kind === "search" ||
    cmd.kind === "entitiesWithClasses"
  ) {
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    if (
      cmd.kind === "filterMany" ||
      cmd.kind === "filterOne" ||
      cmd.kind === "entitiesWithClasses"
    ) {
      return {
        ...cmd,
        options: (body && typeof body === "object"
          ? body
          : {}) as StoreDocumentsSearchOptions,
      };
    }
    if (cmd.kind === "count") {
      const o =
        body && typeof body === "object"
          ? (body as Record<string, unknown>)
          : {};
      // Counts capability only honours search/insensitive (not typed where).
      return {
        ...cmd,
        search:
          typeof o.searchString === "string"
            ? o.searchString
            : typeof o.search === "string"
              ? o.search
              : undefined,
        insensitive:
          typeof o.insensitive === "boolean" ? o.insensitive : undefined,
      };
    }
    const o =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    return {
      ...cmd,
      text: typeof o.text === "string" ? o.text : "",
      limit: typeof o.limit === "number" ? o.limit : undefined,
      mode: o.mode === "entity_rows" ? "entity_rows" : "typed",
    };
  }
  if (cmd.kind === "upsert") {
    const document = await req.json();
    return { ...cmd, document };
  }
  if (cmd.kind === "writeStatements") {
    const body = await req.json();
    const writes =
      body &&
      typeof body === "object" &&
      Array.isArray((body as { writes?: unknown }).writes)
        ? ((body as { writes: unknown[] }).writes as StatementWrite[])
        : [];
    return { ...cmd, writes };
  }
  if (cmd.kind === "loadStatements") {
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const paths =
      body &&
      typeof body === "object" &&
      Array.isArray((body as { paths?: unknown }).paths)
        ? (body as { paths: unknown[] }).paths.filter(
            (p): p is string => typeof p === "string",
          )
        : undefined;
    return { ...cmd, paths };
  }
  if (cmd.kind === "calcWarm") {
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const o =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const rootIRIs = Array.isArray(o.rootIRIs)
      ? o.rootIRIs.filter((x): x is string => typeof x === "string")
      : undefined;
    const skipFresh =
      typeof o.skipFresh === "boolean" ? o.skipFresh : undefined;
    return { ...cmd, rootIRIs, skipFresh };
  }
  return cmd;
};

export const jsonResponse = (
  body: unknown,
  status = 200,
  headers?: Record<string, string>,
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

export const encodeCommandResult = (
  cmd: StoreCommand,
  result: unknown,
): Response => {
  switch (cmd.kind) {
    case "loadOne": {
      if (result == null) {
        return problemResponse(404, "entity_not_found", "Entity not found");
      }
      return jsonResponse(result);
    }
    case "exists": {
      return new Response(null, { status: result ? 200 : 404 });
    }
    case "upsert":
      return jsonResponse(result);
    case "remove":
      return jsonResponse(result ?? {});
    case "list": {
      const items = Array.isArray(result) ? result : [];
      return jsonResponse({
        items,
        pagination: {
          limit: cmd.limit ?? null,
          offset: cmd.offset ?? 0,
          total: items.length,
          hasMore: false,
        },
      });
    }
    case "filterMany": {
      const items = Array.isArray(result) ? result : [];
      return jsonResponse({ items });
    }
    case "filterOne":
      return result == null
        ? problemResponse(404, "entity_not_found", "Entity not found")
        : jsonResponse(result);
    case "count":
      return jsonResponse({ count: typeof result === "number" ? result : 0 });
    case "search": {
      const items = Array.isArray(result) ? result : [];
      return jsonResponse({ items });
    }
    case "resolveTypes":
      return jsonResponse(Array.isArray(result) ? result : []);
    case "writeStatements":
      return jsonResponse(result ?? {});
    case "loadStatements":
      return jsonResponse(result && typeof result === "object" ? result : {});
    case "calcWarm":
      return jsonResponse(result ?? {});
    case "entitiesWithClasses": {
      // Map → plain object for JSON wire
      if (result instanceof Map) {
        return jsonResponse(Object.fromEntries(result));
      }
      if (result && typeof result === "object") {
        return jsonResponse(result);
      }
      return jsonResponse({});
    }
    default:
      return problemResponse(500, "internal_error", "Unhandled command");
  }
};

export type GraviolaProblemBody = {
  type?: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  instance?: string;
};

export const problemResponse = (
  status: number,
  code: string,
  title: string,
  detail?: string,
): Response =>
  jsonResponse(
    {
      type: `https://graviola.dev/errors/${code}`,
      title,
      status,
      code,
      detail: detail ?? title,
    } satisfies GraviolaProblemBody,
    status,
    { "Content-Type": "application/problem+json" },
  );

export type CommandCapability =
  | "loads"
  | "exists"
  | "lists"
  | "filters"
  | "counts"
  | "searches"
  | "writes"
  | "statements"
  | "calc"
  | "removes"
  | "resolves";

export const commandCapability = (cmd: StoreCommand): CommandCapability => {
  switch (cmd.kind) {
    case "loadOne":
      return "loads";
    case "exists":
      return "exists";
    case "list":
      return "lists";
    case "filterMany":
    case "filterOne":
    case "entitiesWithClasses":
      return "filters";
    case "count":
      return "counts";
    case "search":
      return "searches";
    case "upsert":
      return "writes";
    case "writeStatements":
    case "loadStatements":
      return "statements";
    case "calcWarm":
      return "calc";
    case "remove":
      return "removes";
    case "resolveTypes":
      return "resolves";
  }
};
