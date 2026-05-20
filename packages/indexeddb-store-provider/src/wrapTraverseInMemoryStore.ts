import type {
  CRUDFunctions,
  SparqlBuildOptions,
  WalkerOptions,
} from "@graviola/edb-core-types";
import type { CountAndIterable, QueryType } from "@graviola/edb-global-types";
import { traverseGraphExtractBySchema } from "@graviola/edb-graph-traversal";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import type { DatasetCore } from "@rdfjs/types";
import { findEntityByClass } from "@graviola/sparql-schema";
import type { SparqlStore, StoreListQuery } from "@graviola/store-core";
import type { JSONSchema7 } from "json-schema";

function toSearchPick(
  query?: StoreListQuery | QueryType | null,
): Pick<QueryType, "search" | "insensitive"> | null {
  if (!query?.search || query.search.length === 0) return null;
  return {
    search: query.search,
    insensitive: query.insensitive,
  };
}

export type WrapInMemoryTraverseStoreOptions = {
  traversableDataset: DatasetCore;
  /**
   * When set, callers that omit explicit `fields` on {@link SparqlStore.findDocumentsAsFlatResultSet}
   * get this projection (narrow SELECT via Comunica).
   * When omitted, flat listings behave like {@link SparqlStore.findDocumentsAsFlatResultSet} on the base store (full schema projection).
   */
  narrowFlatSelectFields?: string[];
  defaultPrefix: string;
  rootSchema: JSONSchema7;
  walkerOptions?: Partial<WalkerOptions>;
  queryBuildOptions: SparqlBuildOptions;
  defaultLimit: number;
  selectFetch: CRUDFunctions["selectFetch"];
};

/**
 * Layer on {@link SparqlStore} backed by an in-memory `DatasetCore` (same graph Comunica uses):
 * replaces CONSTRUCT-backed single reads with `traverseGraphExtractBySchema`, and optionally substitutes a narrow
 * default `fields` list for flat SELECT listings (`narrowFlatSelectFields`) when callers do not specify fields explicitly.
 *
 * Implemented in `@graviola/indexeddb-store-provider` so `@graviola/sparql-db-impl` stays unchanged.
 */
export function wrapSparqlStoreWithInMemoryTraverseLoad<
  R extends SparqlStore<Record<string, unknown>>,
>(base: R, opts: WrapInMemoryTraverseStoreOptions): R {
  const {
    traversableDataset,
    narrowFlatSelectFields,
    defaultPrefix,
    rootSchema,
    walkerOptions,
    queryBuildOptions,
    defaultLimit,
    selectFetch,
  } = opts;

  const narrowFlatEnabled =
    narrowFlatSelectFields !== undefined && narrowFlatSelectFields.length > 0;

  const traverseLoadDocument = (typeName: string, entityIRI: string) => {
    const schema = bringDefinitionToTop(rootSchema, typeName) as JSONSchema7;
    return traverseGraphExtractBySchema(
      defaultPrefix,
      entityIRI,
      traversableDataset,
      schema,
      {
        ...walkerOptions,
        maxRecursion: walkerOptions?.maxRecursion,
      },
    );
  };

  const traverseFindDocumentsInner = async (
    typeName: string,
    limit?: number,
    searchQuery?: Pick<QueryType, "search" | "insensitive"> | null,
    cb?: (document: any) => Promise<any>,
  ) => {
    const typeIRI = base.typeNameToTypeIRI(typeName);
    const searchString =
      searchQuery?.search && searchQuery.search.length > 0
        ? searchQuery.search
        : null;
    const items = await findEntityByClass(
      searchString,
      typeIRI,
      selectFetch,
      {
        queryBuildOptions,
        defaultPrefix,
        searchInsensitive: searchQuery?.insensitive !== false,
      },
      limit || defaultLimit,
    );
    const results: unknown[] = [];
    for (const { entityIRI } of items) {
      let doc = traverseLoadDocument(typeName, entityIRI);
      if (cb) {
        doc = await cb(doc);
      }
      results.push(doc);
    }
    return results;
  };

  const traverseFindDocumentsIterable = async (
    typeName: string,
    limit?: number,
    searchQuery?: Pick<QueryType, "search" | "insensitive"> | null,
  ): Promise<CountAndIterable<unknown>> => {
    const typeIRI = base.typeNameToTypeIRI(typeName);
    const searchString =
      searchQuery?.search && searchQuery.search.length > 0
        ? searchQuery.search
        : null;
    const items = await findEntityByClass(
      searchString,
      typeIRI,
      selectFetch,
      {
        queryBuildOptions,
        defaultPrefix,
        searchInsensitive: searchQuery?.insensitive !== false,
      },
      limit || defaultLimit,
    );
    let currentIndex = 0;
    const asyncIterator = {
      next: () => {
        if (currentIndex >= items.length) {
          return Promise.resolve({ done: true as const, value: null });
        }
        const entityIRI = items[currentIndex].entityIRI;
        currentIndex++;
        return Promise.resolve({
          done: false as const,
          value: traverseLoadDocument(typeName, entityIRI),
        });
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
    ...base,
    loadOne: async (typeName, iri, options?: { withMeta?: boolean }) => {
      const doc = traverseLoadDocument(typeName, iri);
      if (options?.withMeta) {
        if (doc == null) return null;
        return {
          data: doc,
          provenance: {
            sources: [base.storeId],
            fetchedAt: new Date().toISOString(),
            freshness: "unknown",
          },
        };
      }
      return doc ?? null;
    },

    list: async (typeName, limit, query) => {
      const pick = toSearchPick(query ?? undefined);
      return traverseFindDocumentsInner(typeName, limit, pick, undefined);
    },

    async *streamList(typeName, limit, query) {
      const pick = toSearchPick(query ?? undefined);
      const { iterable } = await traverseFindDocumentsIterable(
        typeName,
        limit,
        pick,
      );
      for await (const doc of iterable as AsyncIterable<unknown>) {
        yield doc;
      }
    },

    ...(narrowFlatEnabled && narrowFlatSelectFields
      ? {
          findDocumentsAsFlatResultSet: async (typeName, query, limit) => {
            const pickFields =
              query?.fields !== undefined && query.fields.length > 0
                ? query.fields
                : narrowFlatSelectFields;
            return base.findDocumentsAsFlatResultSet(
              typeName,
              {
                ...(query ?? {}),
                fields: pickFields,
              },
              limit,
            );
          },
        }
      : {}),
  } as R;
}
