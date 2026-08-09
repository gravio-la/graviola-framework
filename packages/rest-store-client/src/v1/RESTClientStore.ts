import type { Entity } from "@graviola/edb-core-types";
import {
  hasCapabilityInDescriptor,
  type BaseStore,
  type CapabilityDescriptor,
  type CapabilityName,
  type CalcWarmResult,
  type Counts,
  type EntityOf,
  type Exists,
  type Filters,
  type Identifies,
  type Lists,
  type Loads,
  type ReadResult,
  type Removes,
  type Resolves,
  type SchemaRegistry,
  type Searches,
  type Statements,
  type StoreDocumentsSearchOptions,
  type StoreFilterTraversalOptions,
  type StoreId,
  type StoreListQuery,
  type Writes,
} from "@graviola/store-core";
import type { StatementNode, StatementWrite } from "@graviola/provenance-types";

import { capabilityDescriptorFromHandshake } from "../descriptor-from-handshake";
import type {
  GraviolaIriHandlingMode,
  GraviolaStoreHandshakeInner,
  GraviolaStoreHandshakeResponse,
} from "../handshake-types";
import { GRAVIOLA_STORE_ENVELOPE_ACCEPT } from "../handshake-types";
import { GraviolaRestError } from "../shared/errors";
import { throwIfNotOk } from "../shared/errors";
import type { RestTransport } from "../shared/fetcher";
import type { GraviolaCountEnvelope, GraviolaListEnvelope } from "./payloads";
import { entityRelativePath } from "./routes";

const coerceEntityRow = (row: unknown): Entity => {
  if (row && typeof row === "object") {
    const o = row as Record<string, unknown>;
    const entityIRI =
      (typeof o.entityIRI === "string" ? o.entityIRI : undefined) ??
      (typeof o["@id"] === "string" ? (o["@id"] as string) : "") ??
      "";
    const typeIRI =
      (typeof o.typeIRI === "string" ? o.typeIRI : undefined) ??
      (typeof o["@type"] === "string" ? (o["@type"] as string) : "") ??
      "";
    const label =
      typeof o.label === "string"
        ? o.label
        : typeof o.name === "string"
          ? o.name
          : undefined;
    return {
      entityIRI,
      typeIRI,
      value: entityIRI,
      label,
      name: typeof o.name === "string" ? o.name : label,
    };
  }
  return { entityIRI: "", typeIRI: "", value: "" };
};

export type RESTClientStoreOptions<R extends SchemaRegistry = SchemaRegistry> =
  {
    transport: RestTransport;
    handshake: GraviolaStoreHandshakeResponse;
    identifies: Identifies;
    /** Defaults to random UUID */
    storeId?: StoreId;
    iriHandling: GraviolaIriHandlingMode;
    localIdFromIri?: (iri: string) => string;
  };

export type RESTClientStore<R extends SchemaRegistry = SchemaRegistry> =
  BaseStore<R> &
    Loads<R> &
    Lists<R> &
    Filters<R> &
    Writes<R> &
    Removes<R> &
    Counts<R> &
    Searches<R> &
    Exists<R> &
    Resolves &
    Statements<R> & {
      /** Store-level (not per-type) calc materialization — see `Calc` in `@graviola/store-core`. */
      calcWarm: (
        rootIRIs?: string[],
        options?: { skipFresh?: boolean },
      ) => Promise<CalcWarmResult>;
      /**
       * Resolve local entities by secondary authority identifier
       * (`GET /{type}/_by-authority`). Falls back to `filterMany` on `sameAs`
       * when the dedicated route is unavailable.
       */
      findDocumentsByAuthorityIRI: (
        typeName: string,
        authorityIRI: string,
        repositoryIRI?: string,
        limit?: number,
      ) => Promise<EntityOf<R, keyof R & string>[]>;
    };

const ensureProtocolVersion = (inner: GraviolaStoreHandshakeInner): void => {
  if (inner.version !== "1") {
    throw new GraviolaRestError(
      `Unsupported graviolaStore.version ${inner.version} (expected "1")`,
      400,
      "protocol_version_unsupported",
    );
  }
};

const validateIriMode = (
  inner: GraviolaStoreHandshakeInner,
  mode: GraviolaIriHandlingMode,
): void => {
  if (!inner.iriHandling.includes(mode)) {
    throw new GraviolaRestError(
      `iriHandling mode ${mode} not advertised by handshake`,
      400,
      "iri_mode_mismatch",
    );
  }
};

const listSearchParams = (
  limit?: number,
  query?: StoreListQuery,
): URLSearchParams => {
  const p = new URLSearchParams();
  if (query?.pagination) {
    p.set("limit", String(query.pagination.pageSize));
    p.set(
      "offset",
      String(query.pagination.pageIndex * query.pagination.pageSize),
    );
  } else if (limit != null) {
    p.set("limit", String(limit));
  }
  if (query?.search) p.set("search", query.search);
  if (query?.insensitive !== undefined) {
    p.set("insensitive", String(query.insensitive));
  }
  if (query?.sorting?.length) {
    p.set(
      "sort",
      query.sorting.map((s) => `${s.id}${s.desc ? ":desc" : ":asc"}`).join(","),
    );
  }
  return p;
};

const capOrThrow = (desc: CapabilityDescriptor, name: CapabilityName): void => {
  if (name === "identifies") return;
  if (!hasCapabilityInDescriptor(desc, name)) {
    throw new GraviolaRestError(
      `Capability ${String(name)} not advertised for this HTTP store`,
      501,
      "capability_not_supported",
    );
  }
};

const randomStoreId = (): StoreId => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID() as StoreId;
  }
  return `store_${Math.random().toString(36).slice(2)}` as StoreId;
};

/**
 * v1 wire-contract client implemented as a functional factory.
 */
export const createRESTClientStoreClient = <
  R extends SchemaRegistry = SchemaRegistry,
>(
  opts: RESTClientStoreOptions<R>,
): RESTClientStore<R> => {
  const inner = opts.handshake.graviolaStore;
  ensureProtocolVersion(inner);
  validateIriMode(inner, opts.iriHandling);
  opts.transport.advertisedAuthModes = inner.auth.modes;

  const capabilities = capabilityDescriptorFromHandshake(inner);
  const storeId = opts.storeId ?? randomStoreId();
  const typeNameToTypeIRI = opts.identifies.typeNameToTypeIRI;
  const typeIRItoTypeName = opts.identifies.typeIRItoTypeName;

  const rel = (subpath: string): string => {
    const bp = inner.basePath.replace(/^\/+/, "").replace(/\/+$/, "");
    const sub = subpath.replace(/^\/+/, "");
    return bp ? `${bp}/${sub}` : sub;
  };

  const entityPath = (typeName: string, entityIRI: string): string => {
    return entityRelativePath(
      typeName,
      entityIRI,
      opts.iriHandling,
      opts.localIdFromIri,
    );
  };

  type V1LoadOne<RInner extends SchemaRegistry> = {
    <T extends keyof RInner & string>(
      typeName: T,
      iri: string,
      options?: { withMeta?: false },
    ): Promise<EntityOf<RInner, T> | null>;
    <T extends keyof RInner & string>(
      typeName: T,
      iri: string,
      options: { withMeta: true; materialized?: boolean },
    ): Promise<ReadResult<EntityOf<RInner, T>> | null>;
  };

  const loadOne = (async <T extends keyof R & string>(
    typeName: T,
    iri: string,
    options?: { withMeta?: boolean; materialized?: boolean },
  ): Promise<EntityOf<R, T> | ReadResult<EntityOf<R, T>> | null> => {
    capOrThrow(capabilities, "loads");
    const path = rel(entityPath(typeName, iri));
    const accept =
      options?.withMeta === true
        ? GRAVIOLA_STORE_ENVELOPE_ACCEPT
        : "application/json";
    const query = options?.materialized ? "?materialized=1" : "";
    const res = await opts.transport.getUnchecked(`${path}${query}`, {
      headers: { Accept: accept },
    });
    if (res.status === 404) return null;
    await throwIfNotOk(res);
    const json: unknown = await res.json();
    if (options?.withMeta === true) {
      if (
        json &&
        typeof json === "object" &&
        "data" in json &&
        "provenance" in json
      ) {
        return json as ReadResult<EntityOf<R, T>>;
      }
      return {
        data: json as EntityOf<R, T>,
        provenance: {
          sources: [storeId],
          fetchedAt: new Date().toISOString(),
          freshness: "unknown",
        },
      };
    }
    return json as EntityOf<R, T>;
  }) as V1LoadOne<R>;

  const store: RESTClientStore<R> = {
    storeId,
    capabilities,
    typeNameToTypeIRI,
    typeIRItoTypeName,
    loadOne,
    exists: async (typeName: string, entityIRI: string): Promise<boolean> => {
      capOrThrow(capabilities, "exists");
      const path = rel(entityPath(typeName, entityIRI));
      const res = await opts.transport.headUnchecked(path);
      if (res.status === 404) return false;
      await throwIfNotOk(res);
      return true;
    },
    upsert: async <T extends keyof R & string>(
      typeName: T,
      entityIRI: string,
      document: EntityOf<R, T>,
    ): Promise<EntityOf<R, T>> => {
      capOrThrow(capabilities, "writes");
      const path = rel(entityPath(typeName, entityIRI));
      const res = await opts.transport.mutatingJson("PUT", path, document);
      return (await res.json()) as EntityOf<R, T>;
    },
    remove: async (typeName: string, entityIRI: string): Promise<unknown> => {
      capOrThrow(capabilities, "removes");
      const path = rel(entityPath(typeName, entityIRI));
      const res = await opts.transport.mutatingJson("DELETE", path);
      try {
        return await res.json();
      } catch {
        return undefined;
      }
    },
    list: async <T extends keyof R & string>(
      typeName: T,
      limit?: number,
      query?: StoreListQuery,
    ): Promise<EntityOf<R, T>[]> => {
      capOrThrow(capabilities, "lists");
      const qs = listSearchParams(limit, query).toString();
      const path = `${rel(encodeURIComponent(typeName))}${qs ? `?${qs}` : ""}`;
      const res = await opts.transport.get(path);
      const json: unknown = await res.json();
      let items: unknown[];
      if (Array.isArray(json)) items = json;
      else if (json && typeof json === "object" && "items" in json) {
        items = (json as GraviolaListEnvelope).items ?? [];
      } else items = [];
      return items as EntityOf<R, T>[];
    },
    filterOne: async <T extends keyof R & string>(
      typeName: T,
      entityIRI: string,
      options?: StoreFilterTraversalOptions<EntityOf<R, T>>,
    ): Promise<EntityOf<R, T> | null> => {
      capOrThrow(capabilities, "filters");
      // Dedicated wire route so the server can call store.filterOne (subject bind).
      const entityRel = entityRelativePath(
        typeName,
        entityIRI,
        opts.iriHandling,
        opts.localIdFromIri,
      );
      const queryPath = rel(`${entityRel}/_query`);
      try {
        const res = await opts.transport.postJson(queryPath, options ?? {});
        const json: unknown = await res.json();
        return json as EntityOf<R, T>;
      } catch (err) {
        if (err instanceof GraviolaRestError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    filterMany: async <T extends keyof R & string>(
      typeName: T,
      options?: StoreDocumentsSearchOptions<EntityOf<R, T>>,
    ): Promise<EntityOf<R, T>[]> => {
      capOrThrow(capabilities, "filters");
      const path = rel(`${encodeURIComponent(typeName)}/_query`);
      const res = await opts.transport.postJson(path, options ?? {});
      const json: unknown = await res.json();
      let items: unknown[];
      if (Array.isArray(json)) items = json;
      else if (json && typeof json === "object" && "items" in json) {
        items = (json as GraviolaListEnvelope).items ?? [];
      } else items = [];
      return items as EntityOf<R, T>[];
    },
    getEntitiesWithClassesByFilter: async <T = unknown>(
      options: StoreDocumentsSearchOptions<T>,
    ): Promise<Map<string, string[]>> => {
      capOrThrow(capabilities, "filters");
      const path = rel("_entities-with-classes");
      const res = await opts.transport.postJson(path, options ?? {});
      const json: unknown = await res.json();
      const map = new Map<string, string[]>();
      if (json && typeof json === "object" && !Array.isArray(json)) {
        for (const [iri, classes] of Object.entries(
          json as Record<string, unknown>,
        )) {
          if (Array.isArray(classes)) {
            map.set(
              iri,
              classes.filter((c): c is string => typeof c === "string"),
            );
          }
        }
      }
      return map;
    },
    count: async (
      typeName: string,
      query?: Pick<StoreListQuery, "search" | "insensitive">,
    ): Promise<number> => {
      capOrThrow(capabilities, "counts");
      const path = rel(`${encodeURIComponent(typeName)}/_count`);
      const body = {
        searchString: query?.search,
        insensitive: query?.insensitive,
      };
      const res = await opts.transport.postJson(path, body);
      const json: unknown = await res.json();
      if (typeof json === "number") return json;
      if (json && typeof json === "object" && "count" in json) {
        return Number((json as GraviolaCountEnvelope).count);
      }
      return 0;
    },
    searchByLabel: async <T extends keyof R & string>(
      typeName: T,
      label: string,
      limit?: number,
    ): Promise<EntityOf<R, T>[]> => {
      capOrThrow(capabilities, "searches");
      const path = rel(`${encodeURIComponent(typeName)}/_search`);
      const res = await opts.transport.postJson(path, { text: label, limit });
      const json: unknown = await res.json();
      let items: unknown[];
      if (Array.isArray(json)) items = json;
      else if (json && typeof json === "object" && "items" in json) {
        items = (json as GraviolaListEnvelope).items ?? [];
      } else items = [];
      return items as EntityOf<R, T>[];
    },
    findEntityByTypeName: async (
      typeName: string,
      searchString: string,
      limit?: number,
    ): Promise<Entity[]> => {
      capOrThrow(capabilities, "searches");
      const path = rel(`${encodeURIComponent(typeName)}/_search`);
      const res = await opts.transport.postJson(path, {
        text: searchString,
        limit,
        mode: "entity_rows",
      });
      const json: unknown = await res.json();
      const raw: unknown[] = Array.isArray(json)
        ? json
        : json && typeof json === "object" && "items" in json
          ? ((json as GraviolaListEnvelope).items ?? [])
          : [];
      return raw.map((row) => coerceEntityRow(row));
    },
    findDocumentsByAuthorityIRI: async (
      typeName: string,
      authorityIRI: string,
      repositoryIRI?: string,
      limit?: number,
    ): Promise<EntityOf<R, keyof R & string>[]> => {
      capOrThrow(capabilities, "searches");
      const params = new URLSearchParams({ authorityIRI });
      if (repositoryIRI) params.set("repositoryIRI", repositoryIRI);
      if (limit != null) params.set("limit", String(limit));
      const byAuthPath = rel(
        `${encodeURIComponent(typeName)}/_by-authority?${params.toString()}`,
      );
      try {
        const res = await opts.transport.get(byAuthPath);
        const json: unknown = await res.json();
        let items: unknown[];
        if (Array.isArray(json)) items = json;
        else if (json && typeof json === "object" && "items" in json) {
          items = (json as GraviolaListEnvelope).items ?? [];
        } else items = [];
        return items.map((item) => {
          if (typeof item === "string") {
            return { "@id": item } as EntityOf<R, keyof R & string>;
          }
          return item as EntityOf<R, keyof R & string>;
        });
      } catch (err) {
        // Older servers: fall back to typed filter on schema `sameAs`
        if (
          err instanceof GraviolaRestError &&
          (err.status === 404 || err.status === 501)
        ) {
          const filterPath = rel(`${encodeURIComponent(typeName)}/_query`);
          const res = await opts.transport.postJson(filterPath, {
            where: { sameAs: { equals: authorityIRI } },
            select: { "@id": true },
            limit: limit ?? 10,
          });
          const json: unknown = await res.json();
          let items: unknown[];
          if (Array.isArray(json)) items = json;
          else if (json && typeof json === "object" && "items" in json) {
            items = (json as GraviolaListEnvelope).items ?? [];
          } else items = [];
          return items as EntityOf<R, keyof R & string>[];
        }
        throw err;
      }
    },
    resolveTypes: async (entityIRI: string): Promise<string[]> => {
      if (!inner.resolves?.supported) {
        throw new GraviolaRestError(
          "resolveTypes not supported by this server handshake",
          501,
          "capability_not_supported",
        );
      }
      const path = rel(
        `_resolve-types?entityIRI=${encodeURIComponent(entityIRI)}`,
      );
      const res = await opts.transport.get(path);
      const json: unknown = await res.json();
      if (!Array.isArray(json)) return [];
      return json.filter((x): x is string => typeof x === "string");
    },
    writeStatements: async (
      typeName: string,
      entityIRI: string,
      writes: StatementWrite[],
    ): Promise<void> => {
      capOrThrow(capabilities, "statements");
      const path = rel(`${entityPath(typeName, entityIRI)}/_statements`);
      await opts.transport.mutatingJson("PUT", path, { writes });
    },
    loadStatements: async (
      typeName: string,
      entityIRI: string,
      paths?: string[],
    ): Promise<Record<string, StatementNode[]>> => {
      capOrThrow(capabilities, "statements");
      const path = rel(`${entityPath(typeName, entityIRI)}/_statements/query`);
      const res = await opts.transport.postJson(path, { paths });
      const json: unknown = await res.json();
      return json && typeof json === "object"
        ? (json as Record<string, StatementNode[]>)
        : {};
    },
    calcWarm: async (
      rootIRIs?: string[],
      warmOptions?: { skipFresh?: boolean },
    ): Promise<CalcWarmResult> => {
      capOrThrow(capabilities, "calc");
      const path = rel("_calc/warm");
      const res = await opts.transport.postJson(path, {
        rootIRIs,
        skipFresh: warmOptions?.skipFresh,
      });
      const json: unknown = await res.json();
      return json as CalcWarmResult;
    },
  };

  return store;
};
