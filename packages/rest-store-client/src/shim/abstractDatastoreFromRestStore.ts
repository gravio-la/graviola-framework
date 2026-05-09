import type { Entity } from "@graviola/edb-core-types";
import type {
  AbstractDatastore,
  QueryType,
  TypedDocumentFilterOptions,
  TypedDocumentsSearchOptions,
} from "@graviola/edb-global-types";
import type { EntityOf, SchemaRegistry } from "@graviola/store-core";

import type { LegacyWireFindOptions } from "../v0/LegacyRESTClientStore";
import type { LegacyRESTClientStore } from "../v0/LegacyRESTClientStore";
import type { RESTClientStore } from "../v1/RESTClientStore";

const isLegacy = <R extends SchemaRegistry>(
  store: LegacyRESTClientStore<R> | RESTClientStore<R>,
): store is LegacyRESTClientStore<R> => {
  return "legacyFlatResultSet" in store;
};

/** Bridges legacy {@link QueryType} pagination into typed-filter option bags used by HTTP clients. */
const queryToFilterManyOpts = <R extends SchemaRegistry>(
  _typeName: string,
  query: QueryType,
  limit?: number,
): LegacyWireFindOptions<EntityOf<R, keyof R & string>> => {
  return {
    searchString: query.search,
    limit,
    sorting: query.sorting,
    insensitive: query.insensitive,
    ...(query.pagination ? { pagination: query.pagination } : {}),
  };
};

/**
 * Thin {@link AbstractDatastore} façade over a HTTP-backed {@link Store}-shaped client.
 * Used by legacy code paths; React {@link CrudProviderContext} is now typed on {@link CrudDatastoreStore}.
 */
export const abstractDatastoreFromRestStore = <
  R extends SchemaRegistry = SchemaRegistry,
>(
  store: LegacyRESTClientStore<R> | RESTClientStore<R>,
): AbstractDatastore => {
  return {
    typeNameToTypeIRI: store.typeNameToTypeIRI,
    typeIRItoTypeName: store.typeIRItoTypeName,
    importDocument: async () => {
      throw new Error(
        "importDocument is not implemented for HTTP-backed stores",
      );
    },
    importDocuments: async () => {
      throw new Error(
        "importDocuments is not implemented for HTTP-backed stores",
      );
    },
    loadDocument: (typeName, entityIRI) => store.loadOne(typeName, entityIRI),
    existsDocument: (typeName, entityIRI) => store.exists(typeName, entityIRI),
    upsertDocument: (typeName, entityIRI, document) =>
      store.upsert(typeName, entityIRI, document),
    removeDocument: (typeName, entityIRI) => store.remove(typeName, entityIRI),
    listDocuments: (typeName, limit, cb) =>
      store.list(typeName, limit).then(async (docs) => {
        if (!cb) return docs;
        return Promise.all(docs.map((d) => cb(d)));
      }),
    findDocuments: (typeName, query, limit, cb) =>
      store
        .filterMany(
          typeName,
          queryToFilterManyOpts<R>(typeName, query, limit) as never,
        )
        .then(async (docs) => {
          if (!cb) return docs;
          return Promise.all(docs.map((d) => cb(d)));
        }),
    findDocumentsByLabel: (typeName, label, limit) =>
      store.searchByLabel(typeName, label, limit),
    findEntityByTypeName: (
      typeName: string,
      searchString: string,
      limit?: number,
    ) =>
      store.findEntityByTypeName(typeName, searchString, limit) as Promise<
        Entity[]
      >,
    findDocumentsByAuthorityIRI: async () => {
      throw new Error(
        "findDocumentsByAuthorityIRI is not implemented for this HTTP-backed store client",
      );
    },
    findDocumentsAsFlatResultSet: isLegacy(store)
      ? (typeName, query, limit) =>
          store.legacyFlatResultSet(typeName, query, limit)
      : undefined,
    countDocuments: (typeName, query) => store.count(typeName, query),
    getClasses: (entityIRI) => store.resolveTypes(entityIRI),
    /** Non-generic `any` bridge: {@link AbstractDatastore} promises caller-chosen `T`, while {@link Filters} returns registry-bound {@link EntityOf}. */
    filterTypedDocument: (
      typeName: string,
      entityIRI: string,
      options?: TypedDocumentFilterOptions<any>,
    ): Promise<any | null> =>
      store.filterOne(
        typeName as keyof R & string,
        entityIRI,
        options as never,
      ),
    filterTypedDocuments: (
      typeName: string,
      options?: TypedDocumentsSearchOptions<any>,
    ): Promise<any[]> =>
      store.filterMany(typeName as keyof R & string, options as never),
    iterableImplementation: {
      listDocuments: async (typeName, limit) => {
        const items = await store.list(typeName, limit);
        let i = 0;
        return {
          amount: items.length,
          iterable: {
            [Symbol.asyncIterator]: () => ({
              next: async () => {
                if (i >= items.length)
                  return { done: true as const, value: null };
                const value = items[i++];
                return { done: false as const, value };
              },
            }),
          },
        };
      },
      findDocuments: async (typeName, query, limit) => {
        const items = await store.filterMany(
          typeName,
          queryToFilterManyOpts<R>(typeName, query, limit) as never,
        );
        let i = 0;
        return {
          amount: items.length,
          iterable: {
            [Symbol.asyncIterator]: () => ({
              next: async () => {
                if (i >= items.length)
                  return { done: true as const, value: null };
                const value = items[i++];
                return { done: false as const, value };
              },
            }),
          },
        };
      },
    },
  };
};
