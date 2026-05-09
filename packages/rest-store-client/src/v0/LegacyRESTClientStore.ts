import type { Entity } from "@graviola/edb-core-types";
import type { QueryType } from "@graviola/edb-global-types";
import type {
  BaseStore,
  CapabilityDescriptor,
  Counts,
  EntityOf,
  Exists,
  Filters,
  Identifies,
  Lists,
  Loads,
  ReadResult,
  Removes,
  Resolves,
  SchemaRegistry,
  Searches,
  StoreDocumentsSearchOptions,
  StoreFilterTraversalOptions,
  StoreId,
  StoreListQuery,
  Writes,
} from "@graviola/store-core";
import fetch from "cross-fetch";
import qs from "qs";

import { GraviolaRestError } from "../shared/errors";
import type { RestAuthConfig } from "../shared/fetcher";

const decodeURIWithHash = (iri: string) => {
  return decodeURIComponent(iri).replace(/#/g, "%23");
};

const defaultBuildEndpointURL =
  (apiURL: string) =>
  (operation: string, typeName: string, queryString?: string) => {
    const tn = typeName === "" ? "" : `/${typeName}`;
    return `${apiURL}/${operation}${tn}${queryString ? `?${queryString}` : ""}`;
  };

export type LegacyRESTClientStoreOptions = {
  apiURL: string;
  /** Retained for API symmetry with legacy config; IRI→name mapping comes from `identifies`. */
  defaultPrefix?: string;
  requestOptions?: RequestInit;
  buildEndpointURL?: (
    operation: string,
    typeName: string,
    queryString?: string,
  ) => string;
  identifies: Identifies;
  auth?: RestAuthConfig;
  fetchImpl?: typeof fetch;
  storeId?: StoreId;
};

const randomStoreId = (): StoreId => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID() as StoreId;
  }
  return `store_${Math.random().toString(36).slice(2)}` as StoreId;
};

const buildQueryString = (
  baseQuery: Record<string, unknown>,
  query?: QueryType,
  limit?: number,
) => {
  const q = {
    ...baseQuery,
    limit,
    ...(query?.pagination
      ? {
          pageIndex: query.pagination.pageIndex,
          pageSize: query.pagination.pageSize,
        }
      : {}),
    ...(query?.insensitive !== undefined && { insensitive: query.insensitive }),
  };
  return qs.stringify(q);
};

/** v0 wire carries pagination/sorting/search via query-string — extend the Store option bag locally. */
export type LegacyWireFindOptions<T = unknown> =
  StoreDocumentsSearchOptions<T> & {
    sorting?: QueryType["sorting"];
    insensitive?: boolean;
    pagination?: QueryType["pagination"];
  };

const hasUnsupportedTypedFilter = (
  options?: LegacyWireFindOptions<any>,
): boolean => {
  if (!options) return false;
  if (
    options.include ||
    options.select ||
    options.omit ||
    options.walkerOptions
  ) {
    return true;
  }
  const w = options.where as Record<string, unknown> | undefined;
  if (!w || Object.keys(w).length === 0) return false;
  return true;
};

/**
 * v0 wire client matching legacy {@link initRestfullStore} URL conventions.
 */
export type LegacyRESTClientStore<R extends SchemaRegistry = SchemaRegistry> =
  BaseStore<R> &
    Loads<R> &
    Lists<R> &
    Filters<R> &
    Writes<R> &
    Removes<R> &
    Counts<R> &
    Searches<R> &
    Exists<R> &
    Resolves & {
      legacyFlatResultSet(
        typeName: string,
        query: QueryType,
        limit?: number,
      ): Promise<unknown>;
    };

export const createLegacyRESTClientStore = <
  R extends SchemaRegistry = SchemaRegistry,
>(
  opts: LegacyRESTClientStoreOptions,
): LegacyRESTClientStore<R> => {
  const apiURL = opts.apiURL.replace(/\/+$/, "");
  const requestOptions = opts.requestOptions;
  const buildEndpointURL =
    opts.buildEndpointURL ?? defaultBuildEndpointURL(apiURL);
  const fetchImpl = opts.fetchImpl ?? fetch;
  const auth = opts.auth;
  const storeId = opts.storeId ?? randomStoreId();
  const typeNameToTypeIRI = opts.identifies.typeNameToTypeIRI;
  const typeIRItoTypeName = opts.identifies.typeIRItoTypeName;
  const capabilities: CapabilityDescriptor = {
    identifies: true,
    loads: true,
    lists: true,
    writes: true,
    removes: true,
    counts: true,
    searches: true,
    exists: true,
    resolves: true,
    profiles: { searches: { mode: "substring", ranked: false } },
  };

  const applyAuth = async (headers: Headers): Promise<void> => {
    const activeAuth = auth ?? { mode: "none" as const };
    if (activeAuth.mode === "none") return;
    if (activeAuth.mode === "bearer") {
      headers.set("Authorization", `Bearer ${await activeAuth.token()}`);
    } else {
      headers.set(activeAuth.header, await activeAuth.key());
    }
  };

  const rawFetch = async (
    url: string,
    init?: RequestInit,
  ): Promise<Response> => {
    const headers = new Headers(init?.headers);
    await applyAuth(headers);
    const merged = { ...requestOptions, ...init, headers };
    return fetchImpl(url, merged);
  };

  type LegacyLoadOne<RInner extends SchemaRegistry> = {
    <T extends keyof RInner & string>(
      typeName: T,
      iri: string,
      options?: { withMeta?: false },
    ): Promise<EntityOf<RInner, T> | null>;
    <T extends keyof RInner & string>(
      typeName: T,
      iri: string,
      options: { withMeta: true },
    ): Promise<ReadResult<EntityOf<RInner, T>> | null>;
  };

  const loadOne = (async <T extends keyof R & string>(
    typeName: T,
    iri: string,
    options?: { withMeta?: boolean },
  ): Promise<EntityOf<R, T> | ReadResult<EntityOf<R, T>> | null> => {
    const url = buildEndpointURL(
      "loadDocument",
      typeName,
      `id=${decodeURIWithHash(iri)}`,
    );
    const res = await rawFetch(url);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return null;
    }
    if (!res.ok || data === null) return null;
    if (options?.withMeta === true) {
      return {
        data: data as EntityOf<R, T>,
        provenance: {
          sources: [storeId],
          fetchedAt: new Date().toISOString(),
          freshness: "unknown",
        },
      };
    }
    return data as EntityOf<R, T>;
  }) as LegacyLoadOne<R>;

  const store: LegacyRESTClientStore<R> = {
    storeId,
    capabilities,
    typeNameToTypeIRI,
    typeIRItoTypeName,
    loadOne,
    exists: async (typeName: string, entityIRI: string): Promise<boolean> => {
      const url = buildEndpointURL(
        "existsDocument",
        typeName,
        `id=${decodeURIWithHash(entityIRI)}`,
      );
      const res = await rawFetch(url);
      const text = await res.text();
      return text === "true";
    },
    upsert: async <T extends keyof R & string>(
      typeName: T,
      entityIRI: string,
      document: EntityOf<R, T>,
    ): Promise<EntityOf<R, T>> => {
      const url = buildEndpointURL("upsertDocument", typeName);
      const headers = new Headers(requestOptions?.headers);
      headers.set("Content-Type", "application/json");
      await applyAuth(headers);
      const res = await rawFetch(url, {
        ...requestOptions,
        method: "PUT",
        headers,
        body: JSON.stringify(document),
      });
      return (await res.json()) as EntityOf<R, T>;
    },
    remove: async (typeName: string, entityIRI: string): Promise<unknown> => {
      const url = buildEndpointURL(
        "removeDocument",
        typeName,
        `id=${decodeURIWithHash(entityIRI)}`,
      );
      const res = await rawFetch(url, {
        ...requestOptions,
        method: "DELETE",
      });
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
      if (
        query &&
        (query.search ||
          query.pagination ||
          query.sorting ||
          query.insensitive !== undefined)
      ) {
        const optsLocal: LegacyWireFindOptions<EntityOf<R, T>> = {
          searchString: query.search,
          limit,
        };
        if (query.pagination) optsLocal.pagination = query.pagination;
        if (query.sorting) optsLocal.sorting = query.sorting;
        if (query.insensitive !== undefined) {
          optsLocal.insensitive = query.insensitive;
        }
        return store.filterMany(typeName, optsLocal);
      }
      const queryString = buildQueryString({}, undefined, limit);
      const url = buildEndpointURL("listDocuments", typeName, queryString);
      const res = await rawFetch(url);
      const items: unknown = await res.json();
      if (!items || !Array.isArray(items)) return [];
      return items as EntityOf<R, T>[];
    },
    filterOne: async <T extends keyof R & string>(
      typeName: T,
      entityIRI: string,
      options?: StoreFilterTraversalOptions<EntityOf<R, T>>,
    ): Promise<EntityOf<R, T> | null> => {
      if (hasUnsupportedTypedFilter(options as LegacyWireFindOptions<any>)) {
        throw new GraviolaRestError(
          "Legacy v0 HTTP contract cannot express typed filter traversal",
          501,
          "capability_not_supported",
        );
      }
      return store.loadOne(typeName, entityIRI);
    },
    filterMany: async <T extends keyof R & string>(
      typeName: T,
      options?: LegacyWireFindOptions<EntityOf<R, T>>,
    ): Promise<EntityOf<R, T>[]> => {
      if (hasUnsupportedTypedFilter(options)) {
        throw new GraviolaRestError(
          "Legacy v0 HTTP contract cannot express typed filter traversal",
          501,
          "capability_not_supported",
        );
      }
      const qt: QueryType = {};
      const optPag = (
        options as {
          pagination?: QueryType["pagination"];
        }
      ).pagination;
      if (optPag) qt.pagination = optPag;
      if (options?.sorting)
        qt.sorting = options.sorting as QueryType["sorting"];
      if (options?.insensitive !== undefined)
        qt.insensitive = options.insensitive;

      const queryString = buildQueryString(
        {
          ...(options?.searchString !== undefined &&
          options.searchString !== null
            ? { search: options.searchString }
            : {}),
        },
        Object.keys(qt).length > 0 ? qt : undefined,
        options?.limit,
      );
      const url = buildEndpointURL("findDocuments", typeName, queryString);
      const res = await rawFetch(url);
      const items: unknown = await res.json();
      if (!items || !Array.isArray(items)) return [];
      return items as EntityOf<R, T>[];
    },
    count: async (
      typeName: string,
      query?: Pick<StoreListQuery, "search" | "insensitive">,
    ): Promise<number> => {
      const queryString = qs.stringify(query ?? {});
      const url = buildEndpointURL("countDocuments", typeName, queryString);
      const res = await rawFetch(url);
      const text = await res.text();
      if (text.match(/^\d+$/)) return parseInt(text, 10);
      return 0;
    },
    searchByLabel: async <T extends keyof R & string>(
      typeName: T,
      label: string,
      limit?: number,
    ): Promise<EntityOf<R, T>[]> => {
      const queryString = buildQueryString({ label }, undefined, limit);
      const url = buildEndpointURL(
        "findDocumentsByLabel",
        typeName,
        queryString,
      );
      const res = await rawFetch(url);
      const items: unknown = await res.json();
      if (!items || !Array.isArray(items)) return [];
      return items as EntityOf<R, T>[];
    },
    findEntityByTypeName: async (
      typeName: string,
      searchString: string,
      limit?: number,
    ): Promise<Entity[]> => {
      const rows = await store.filterMany(typeName as keyof R & string, {
        searchString,
        limit,
      });
      return rows.map((r) => ({
        entityIRI: (r as Record<string, unknown>)["@id"] as string,
        typeIRI: (r as Record<string, unknown>)["@type"] as string,
        value: (r as Record<string, unknown>)["@id"] as string,
      }));
    },
    resolveTypes: async (entityIRI: string): Promise<string[]> => {
      const url = buildEndpointURL(
        "classes",
        "",
        `id=${decodeURIWithHash(entityIRI)}`,
      );
      const res = await rawFetch(url);
      const json: unknown = await res.json();
      if (!Array.isArray(json)) return [];
      return json.filter((x): x is string => typeof x === "string");
    },
    legacyFlatResultSet: async (
      typeName: string,
      query: QueryType,
      limit?: number,
    ): Promise<unknown> => {
      const sorting =
        query.sorting?.map(({ id, desc }) => `${id}${desc ? " desc" : ""}`) ||
        [];
      const queryString = buildQueryString(
        {
          search: query.search,
          sorting,
        },
        query,
        limit,
      );
      const url = buildEndpointURL(
        "findDocumentsAsFlat",
        typeName,
        queryString,
      );
      const res = await rawFetch(url);
      return await res.json();
    },
  };

  return store;
};
