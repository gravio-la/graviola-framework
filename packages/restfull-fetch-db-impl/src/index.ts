import fetch from "cross-fetch";
import type { StringToIRIFn } from "@graviola/edb-core-types";
import type {
  AbstractDatastore,
  CountAndIterable,
  DatastoreBaseConfig,
  InitDatastoreFunction,
  QueryType,
} from "@graviola/edb-global-types";
import qs from "qs";

export type RestfullDataStoreConfig = {
  apiURL: string;
  defaultPrefix: string;
  typeNameToTypeIRI: StringToIRIFn;
  defaultLimit?: number;
  requestOptions?: RequestInit;
  buildEndpointURL?: (
    operation: string,
    typeName: string,
    queryString?: string,
  ) => string;
} & DatastoreBaseConfig;

const decodeURIWithHash = (iri: string) => {
  return decodeURIComponent(iri).replace(/#/g, "%23");
};

const buildQueryString = (
  baseQuery: Record<string, any>,
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

const defaultBuildEndpointURL =
  (apiURL: string) =>
  (operation: string, typeName: string, queryString?: string) => {
    return `${apiURL}/${operation}/${typeName}${queryString ? `?${queryString}` : ""}`;
  };

export const initRestfullStore: InitDatastoreFunction<
  RestfullDataStoreConfig
> = (dataStoreConfig) => {
  const {
    apiURL,
    defaultPrefix,
    typeNameToTypeIRI,
    defaultLimit,
    requestOptions,
    buildEndpointURL = defaultBuildEndpointURL(apiURL),
  } = dataStoreConfig;
  const loadDocument = async (typeName: string, entityIRI: string) => {
    return await fetch(
      buildEndpointURL(
        "loadDocument",
        typeName,
        `id=${decodeURIWithHash(entityIRI)}`,
      ),
    ).then((res) => {
      try {
        return res.json();
      } catch (e) {
        console.error(e);
        return null;
      }
    });
  };
  const findDocuments = async (
    typeName: string,
    limit?: number,
    searchString?: string | null,
    cb?: (document: any) => Promise<any>,
  ) => {
    const queryString = buildQueryString(
      { search: searchString },
      undefined,
      limit,
    );
    const items = await fetch(
      buildEndpointURL("findDocuments", typeName, queryString),
      requestOptions,
    ).then((res) => res.json());
    if (!items || !Array.isArray(items)) return [];
    return await Promise.all(
      items.map(async (doc) => {
        if (cb) {
          return await cb(doc);
        }
        return doc;
      }),
    );
  };
  const findDocumentsIterable: (
    typeName: string,
    limit?: number,
    searchQuery?: QueryType | null,
  ) => Promise<CountAndIterable<any>> = async (
    typeName: string,
    limit?: number,
    searchQuery?: QueryType | null,
  ) => {
    const queryString = buildQueryString(
      {
        ...(searchQuery?.search !== undefined && searchQuery.search !== null
          ? { search: searchQuery.search }
          : {}),
      },
      searchQuery ?? undefined,
      limit,
    );
    const items = await fetch(
      buildEndpointURL("findDocuments", typeName, queryString),
      requestOptions,
    ).then((res) => res.json());
    let currentIndex = 0;
    const asyncIterator = {
      next: () => {
        if (currentIndex >= items.length) {
          return Promise.resolve({ done: true, value: null });
        }
        const value = items[currentIndex].value;
        currentIndex++;
        return Promise.resolve({ done: false, value: value });
      },
    };
    return {
      amount: items.length,
      iterable: {
        [Symbol.asyncIterator]: () => asyncIterator,
      },
    };
  };
  return {
    typeNameToTypeIRI,
    typeIRItoTypeName: (iri: string) => iri.replace(defaultPrefix, ""),
    importDocument: async (typeName, entityIRI, importStore) => {
      throw new Error("Not implemented");
    },
    importDocuments: async (typeName, importStore, limit) => {
      throw new Error("Not implemented");
    },
    loadDocument,
    existsDocument: async (typeName, entityIRI) => {
      return await fetch(
        buildEndpointURL(
          "existsDocument",
          typeName,
          `id=${decodeURIWithHash(entityIRI)}`,
        ),
        requestOptions,
      )
        .then((res) => res.text())
        .then((res) => res === "true");
    },
    removeDocument: async (typeName, entityIRI) => {
      return await fetch(
        buildEndpointURL(
          "removeDocument",
          typeName,
          `id=${decodeURIWithHash(entityIRI)}`,
        ),
        {
          ...(requestOptions || {}),
          method: "DELETE",
        },
      ).then((res) => res.json());
    },
    upsertDocument: async (typeName, entityIRI, document) => {
      return await fetch(buildEndpointURL("upsertDocument", typeName), {
        ...(requestOptions || {}),
        method: "PUT",
        headers: {
          ...(requestOptions?.headers || {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(document),
      }).then((res) => res.json());
    },
    listDocuments: async (typeName, limit, cb) =>
      findDocuments(typeName, limit, null, cb),
    findDocuments: async (typeName, query, limit, cb) => {
      const queryString = buildQueryString(
        { search: query.search },
        query,
        limit,
      );
      const items = await fetch(
        buildEndpointURL("findDocuments", typeName, queryString),
        requestOptions,
      ).then((res) => res.json());
      if (!items || !Array.isArray(items)) return [];
      return await Promise.all(
        items.map(async (doc) => {
          if (cb) {
            return await cb(doc);
          }
          return doc;
        }),
      );
    },
    findDocumentsByLabel: async (typeName, label, limit) => {
      const queryString = buildQueryString({ label }, undefined, limit);
      return await fetch(
        buildEndpointURL("findDocumentsByLabel", typeName, queryString),
        requestOptions,
      ).then((res) => res.json());
    },
    findDocumentsByAuthorityIRI: async (
      typeName,
      authorityIRI,
      repositoryIRI,
      limit,
    ) => {
      const queryString = buildQueryString(
        {
          authorityIRI: decodeURIWithHash(authorityIRI),
          repositoryIRI: repositoryIRI
            ? decodeURIWithHash(repositoryIRI)
            : undefined,
        },
        undefined,
        limit,
      );
      return await fetch(
        buildEndpointURL("findDocumentsByAuthorityIRI", typeName, queryString),
        requestOptions,
      ).then((res) => res.json());
    },
    findDocumentsAsFlatResultSet: async (typeName, query, limit) => {
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

      return await fetch(
        buildEndpointURL("findDocumentsAsFlat", typeName, queryString),
        requestOptions,
      ).then((res) => res.json());
    },
    getClasses: (entityIRI: string) => {
      return fetch(
        buildEndpointURL("classes", "", `id=${decodeURIWithHash(entityIRI)}`),
        requestOptions,
      ).then((res) => res.json());
    },
    countDocuments: async (typeName, query) => {
      const queryString = qs.stringify(query);
      return await fetch(
        buildEndpointURL("countDocuments", typeName, queryString),
        requestOptions,
      ).then(async (res) => {
        const text = await res.text();
        if (text.match(/^\d+$/)) {
          return parseInt(text);
        }
        return 0;
      });
    },
    iterableImplementation: {
      listDocuments: (typeName, limit) => {
        return findDocumentsIterable(typeName, limit, null);
      },
      findDocuments: (typeName, query, limit) => {
        return findDocumentsIterable(
          typeName,
          limit,
          query.search && query.search.length > 0 ? query : null,
        );
      },
    },
  } as AbstractDatastore;
};
