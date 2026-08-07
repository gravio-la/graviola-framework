import type {
  AbstractDatastore,
  CountAndIterable,
  QueryType,
  TypedDocumentFilterOptions,
  TypedDocumentsSearchOptions,
} from "@graviola/edb-global-types";
import {
  bringDefinitionToTop,
  getInverseProperties,
} from "@graviola/json-schema-utils";
import { cleanJSONLD } from "@graviola/jsonld-utils";
import {
  exists,
  findEntityByAuthorityIRI,
  findEntityByClass,
  getClasses,
  annotationProjectionsToSparql,
  jsonSchema2Select,
  load,
  makeSPARQLInverseSyncQuery,
  remove,
  save,
  searchEntityByLabel,
  withDefaultPrefix,
  filterTypedDocuments,
  type TypedFilterOptions,
  getEntitiesWithClassesByFilter as getEntitiesWithClassesByFilterImpl,
} from "@graviola/sparql-schema";
import type { JSONSchema7 } from "json-schema";
import {
  applyMetaStampingOnWrite,
  buildMetaAnnotationProjections,
  deriveExtendedSchema,
  deriveMetaProfileForStamping,
  ENTITY_META_JSON_KEY,
  ENTITY_META_PERSISTENCE_KEY,
  lifecycleTimestampsEnabled,
  mergeMetaAnnotationScopes,
  remapEntityMetaForPersistence,
  remapEntityMetaFromPersistence,
  resolveEntityMetaProfile,
  resolveSparqlMetaStamping,
} from "@graviola/meta-schema";
import type { StatementWrite } from "@graviola/provenance-types";
import {
  alwaysStatementPathsForType,
  applyStatementWrites,
  deriveProvenanceSchema,
  remapStatementsForPersistence,
  remapStatementsFromPersistence,
  resolveStatementMetaProfile,
  resolveStatementPolicy,
  statementValueHash,
  statementsForPath,
  stripClientStatements,
} from "@graviola/statement-meta";
import {
  buildRdf12StatementDelete,
  buildRdf12StatementInsert,
  buildRdf12StatementSelect,
  parseRdf12StatementBindings,
  propertyIriFromPath,
} from "./rdf12Statements";
import type {
  EntityChangeEvent,
  SparqlStore,
  StoreId,
  StoreListQuery,
} from "@graviola/store-core";
import { createChangeBus } from "@graviola/store-core";
import { resolveSparqlFeatures } from "@graviola/edb-core-utils";

import type { SPARQLDataStoreConfig } from "./SPARQLDataStoreConfig";

export type SPARQLDatastorePair = {
  /** New capability-composed interface */
  store: SparqlStore<Record<string, unknown>>;
  /** Legacy `AbstractDatastore` for contract tests and Prisma import sources */
  abstractDatastore: AbstractDatastore;
};

function toSearchPick(
  query?: StoreListQuery | QueryType | null,
): Pick<QueryType, "search" | "insensitive"> | null {
  if (!query?.search || query.search.length === 0) return null;
  return {
    search: query.search,
    insensitive: query.insensitive,
  };
}

/**
 * Internal factory — builds both the new {@link SparqlStore} and legacy {@link AbstractDatastore}
 * sharing the same SPARQL closures.
 */
export function initSPARQLDatastorePair(
  dataStoreConfig: SPARQLDataStoreConfig,
): SPARQLDatastorePair {
  const {
    defaultPrefix,
    jsonldContext,
    typeNameToTypeIRI,
    queryBuildOptions,
    walkerOptions,
    sparqlQueryFunctions: {
      constructFetch,
      selectFetch,
      updateFetch,
      askFetch,
    },
    defaultLimit,
    makeStubSchema,
    schema: rootSchema,
    enableInversePropertiesFeature,
    defaultUpdateGraph,
    metaStamping,
    statementMeta,
    defaultFilterOptions,
  } = dataStoreConfig;

  const effectiveMetaStamping = metaStamping
    ? resolveSparqlMetaStamping(metaStamping)
    : undefined;

  const statementEncoding = statementMeta?.encoding ?? "statement-node";

  let persistenceSchema = effectiveMetaStamping
    ? rootSchema.definitions?.EntityMeta
      ? rootSchema
      : deriveExtendedSchema(
          rootSchema,
          deriveMetaProfileForStamping(effectiveMetaStamping),
          {
            includeLifecycle: lifecycleTimestampsEnabled(effectiveMetaStamping),
          },
        )
    : rootSchema;

  if (statementMeta && statementEncoding === "statement-node") {
    persistenceSchema = deriveProvenanceSchema(
      persistenceSchema,
      statementMeta.statementSchema,
      { policies: statementMeta.policies },
    );
  }

  const schemaForType = (typeName: string) =>
    bringDefinitionToTop(
      makeStubSchema ? makeStubSchema(persistenceSchema) : persistenceSchema,
      typeName,
    ) as JSONSchema7;

  const listSchemaForType = (typeName: string) => schemaForType(typeName);

  const typeIRItoTypeName = queryBuildOptions.typeIRItoTypeName;
  const flavour = queryBuildOptions.sparqlFlavour ?? "default";
  const features = resolveSparqlFeatures(
    flavour,
    queryBuildOptions.sparqlFeatures,
  );
  const nestedPaginationStage = features.lateralNestedPagination
    ? ("query" as const)
    : ("extraction" as const);

  const changeBus = createChangeBus();
  const storeId = `sparql:${flavour}` as StoreId;

  const emitChange = (event: EntityChangeEvent) => {
    changeBus.emit(event);
  };

  const remapLoadedDocument = <T>(
    document: T | null | undefined,
  ): T | null | undefined => {
    if (!document || typeof document !== "object") return document;
    let out = document as Record<string, unknown>;
    if (effectiveMetaStamping) {
      out = remapEntityMetaFromPersistence(out) as Record<string, unknown>;
    }
    if (statementMeta && statementEncoding === "statement-node") {
      out = remapStatementsFromPersistence(out) as Record<string, unknown>;
    }
    return out as T;
  };

  const loadDocument = async (typeName: string, entityIRI: string) => {
    const typeIRI = typeNameToTypeIRI(typeName);
    const schema = schemaForType(typeName);
    const res = await load(entityIRI, typeIRI, schema, constructFetch, {
      defaultPrefix,
      queryBuildOptions,
      walkerOptions,
      maxRecursion: walkerOptions?.maxRecursion,
    });
    const document = res.document;
    return document ? remapLoadedDocument(document) : document;
  };

  const persistDocument = async (
    typeName: string,
    entityIRI: string,
    document: Record<string, unknown>,
    opts?: { keepStatements?: boolean },
  ) => {
    const schema = schemaForType(typeName);
    let doc: Record<string, unknown> = {
      ...document,
      "@id": entityIRI,
      "@type": typeNameToTypeIRI(typeName),
    };

    if (statementMeta) {
      doc = opts?.keepStatements
        ? remapStatementsForPersistence(doc)
        : stripClientStatements(doc);
    }

    if (effectiveMetaStamping) {
      const previous = await loadDocument(typeName, entityIRI).catch(
        () => null,
      );
      doc = applyMetaStampingOnWrite(
        doc,
        typeName,
        persistenceSchema,
        effectiveMetaStamping,
        previous as Record<string, unknown> | null,
      );
      doc = remapEntityMetaForPersistence(doc);
    }

    const cleanData = await cleanJSONLD(
      doc as Parameters<typeof cleanJSONLD>[0],
      schema,
      {
        jsonldContext,
        defaultPrefix,
        keepContext: true,
        removeInverseProperties: true,
        pruneLinkedDocuments: true,
      },
    );
    await save(cleanData, schema, updateFetch, {
      defaultPrefix,
      queryBuildOptions,
      defaultUpdateGraph,
    });

    if (enableInversePropertiesFeature) {
      const schemaForInverse = bringDefinitionToTop(rootSchema, typeName);
      const inverseProperties = getInverseProperties(
        rootSchema,
        schemaForInverse as JSONSchema7,
        doc as Parameters<typeof getInverseProperties>[2],
      );
      const inversePropertiesWithTypeIRI = inverseProperties.map(
        (inverseProperty) => ({
          ...inverseProperty,
          typeIRI: typeNameToTypeIRI(inverseProperty.typeName),
        }),
      );

      const inversePropertiesSyncQuery = makeSPARQLInverseSyncQuery(
        entityIRI,
        inversePropertiesWithTypeIRI,
        {
          defaultPrefix,
          queryBuildOptions,
          defaultUpdateGraph,
        },
      );
      if (inversePropertiesSyncQuery) {
        await updateFetch(inversePropertiesSyncQuery);
      }
    }
    return remapLoadedDocument(doc) as Record<string, unknown>;
  };

  const findDocumentsInner = async (
    typeName: string,
    limit?: number,
    searchQuery?: Pick<QueryType, "search" | "insensitive"> | null,
    cb?: (document: any) => Promise<any>,
  ) => {
    const typeIRI = typeNameToTypeIRI(typeName);
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
    const results: any[] = [];
    for (const { entityIRI } of items) {
      const doc = await loadDocument(typeName, entityIRI);
      if (cb) {
        results.push(await cb(doc));
      } else {
        results.push(doc);
      }
    }
    return results;
  };

  const findDocumentsIterable: (
    typeName: string,
    limit?: number,
    searchQuery?: Pick<QueryType, "search" | "insensitive"> | null,
  ) => Promise<CountAndIterable<any>> = async (
    typeName: string,
    limit?: number,
    searchQuery?: Pick<QueryType, "search" | "insensitive"> | null,
  ) => {
    const typeIRI = typeNameToTypeIRI(typeName);
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
          return Promise.resolve({ done: true, value: null });
        }
        const entityIRI = items[currentIndex].entityIRI;
        currentIndex++;
        return loadDocument(typeName, entityIRI).then((doc) => {
          return { done: false, value: doc };
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

  const abstractDatastore: AbstractDatastore = {
    typeNameToTypeIRI,
    typeIRItoTypeName: (iri: string) => iri.replace(defaultPrefix, ""),
    importDocument: async () => {
      throw new Error("Not implemented");
    },
    importDocuments: async () => {
      throw new Error("Not implemented");
    },
    loadDocument,
    existsDocument: async (typeName, entityIRI) => {
      return await exists(entityIRI, typeNameToTypeIRI(typeName), askFetch);
    },
    removeDocument: async (typeName, entityIRI) => {
      const schema = bringDefinitionToTop(
        makeStubSchema ? makeStubSchema(rootSchema) : rootSchema,
        typeName,
      ) as JSONSchema7;
      return await remove(
        entityIRI,
        typeNameToTypeIRI(typeName),
        schema,
        updateFetch,
        {
          defaultPrefix,
          queryBuildOptions,
          defaultUpdateGraph,
        },
      );
    },
    upsertDocument: async (typeName, entityIRI, document) => {
      return persistDocument(typeName, entityIRI, document, {
        keepStatements: false,
      });
    },
    listDocuments: (typeName, limit, cb) =>
      findDocumentsInner(typeName, limit, null, cb),
    findDocuments: (typeName, query, limit, cb) =>
      findDocumentsInner(
        typeName,
        limit,
        query.search && query.search.length > 0 ? query : null,
        cb,
      ),
    findDocumentsByLabel: async (typeName, label, limit = 10) => {
      const typeIRI = typeNameToTypeIRI(typeName);
      const ids = await searchEntityByLabel(
        label,
        typeIRI,
        selectFetch,
        limit,
        {
          defaultPrefix,
          prefixes: queryBuildOptions.prefixes || {},
          ...queryBuildOptions,
          typeIRItoTypeName,
          primaryFields: queryBuildOptions.primaryFields,
        },
      );
      return ids;
    },
    findEntityByTypeName: async (typeName, searchString, limit) => {
      const typeIRI = typeNameToTypeIRI(typeName);
      return await findEntityByClass(
        searchString,
        typeIRI,
        selectFetch,
        {
          defaultPrefix,
          queryBuildOptions,
        },
        limit,
      );
    },
    findDocumentsByAuthorityIRI: async (
      typeName,
      authorityIRI,
      repositoryIRI,
      limit = 10,
    ) => {
      const typeIRI = typeNameToTypeIRI(typeName);
      const ids = await findEntityByAuthorityIRI(
        authorityIRI,
        typeIRI,
        selectFetch,
        limit,
        {
          defaultPrefix,
          prefixes: queryBuildOptions.prefixes || {},
        },
      );
      return ids;
    },
    findDocumentsAsFlatResultSet: async (typeName, query, limit) => {
      const typeIRI = typeNameToTypeIRI(typeName);
      const loadedSchema = listSchemaForType(typeName);
      const { sorting, pagination, fields, annotationScopes } = query;

      const excludeProperties = effectiveMetaStamping
        ? [ENTITY_META_PERSISTENCE_KEY, ENTITY_META_JSON_KEY]
        : [];

      let annotationFragments:
        | ReturnType<typeof annotationProjectionsToSparql>
        | undefined;

      if (effectiveMetaStamping) {
        const mergedScopes = mergeMetaAnnotationScopes(
          annotationScopes,
          sorting?.map((entry) => entry.id),
        );
        if (mergedScopes.length > 0) {
          const metaProfile = deriveMetaProfileForStamping(
            effectiveMetaStamping,
          );
          const projections = buildMetaAnnotationProjections(
            metaProfile,
            mergedScopes,
          );
          if (projections.length > 0) {
            annotationFragments = annotationProjectionsToSparql(projections);
          }
        }
      }

      const queryString = withDefaultPrefix(
        defaultPrefix,
        jsonSchema2Select(
          loadedSchema,
          typeIRI,
          excludeProperties,
          fields,
          {
            primaryFields: queryBuildOptions.primaryFields,
            ...(sorting && sorting.length > 0
              ? {
                  orderBy: sorting.map((s) => ({
                    orderBy: s.id,
                    descending: Boolean(s.desc),
                  })),
                }
              : {}),
            limit: limit || defaultLimit,
            ...(pagination
              ? {
                  offset: pagination.pageIndex * pagination.pageSize,
                  limit: pagination.pageSize,
                }
              : {}),
          },
          undefined,
          queryBuildOptions.sparqlFlavour,
          undefined,
          annotationFragments,
        ),
      );
      const res = await selectFetch(queryString, {
        withHeaders: true,
        queryKey: "datastore:findDocumentsAsFlatResultSet",
      });
      return res;
    },
    countDocuments: async (typeName, query) => {
      const typeIRI = typeNameToTypeIRI(typeName);
      const loadedSchema = listSchemaForType(typeName);
      const queryString = withDefaultPrefix(
        defaultPrefix,
        jsonSchema2Select(
          loadedSchema,
          typeIRI,
          [],
          [],
          undefined,
          true,
          queryBuildOptions.sparqlFlavour,
        ),
      );
      const res = await selectFetch(queryString, {
        withHeaders: true,
        queryKey: "datastore:countDocuments",
      });
      const literalValue = res.results?.bindings[0]?.entity_count?.value;
      if (!literalValue) {
        throw new Error("Cannot find entity_count in query result");
      }
      const amount = parseInt(literalValue);
      if (isNaN(amount)) {
        throw new Error("Invalid count");
      }
      return amount;
    },
    getClasses: (entityIRI) => {
      return getClasses(entityIRI, selectFetch, {
        defaultPrefix,
        queryBuildOptions,
      }).then((classes) => classes || []);
    },
    getEntitiesWithClassesByFilter: async <T = any>(
      options: TypedDocumentsSearchOptions<T> = {},
    ): Promise<Map<string, string[]>> => {
      return await getEntitiesWithClassesByFilterImpl(constructFetch, {
        where: options.where,
        prefixMap: queryBuildOptions.prefixes || {},
        defaultPrefix,
        flavour: queryBuildOptions.sparqlFlavour,
      });
    },
    filterTypedDocument: async <T = any>(
      typeName: string,
      entityIRI: string,
      options: TypedDocumentFilterOptions<T> = {},
    ): Promise<T | null> => {
      const typeIRI = typeNameToTypeIRI(typeName);
      const schema = listSchemaForType(typeName);

      const sparqlOptions: TypedFilterOptions<T> = {
        ...defaultFilterOptions,
        ...options,
        defaultPrefix,
        queryBuildOptions,
        flavour: options.flavour ?? queryBuildOptions.sparqlFlavour,
        sparqlFeatures: queryBuildOptions.sparqlFeatures,
        maxRecursion:
          options.maxRecursion ?? defaultFilterOptions?.maxRecursion,
        walkerOptions: {
          ...walkerOptions,
          ...options.walkerOptions,
        },
      };

      const result = await filterTypedDocuments<T>(
        entityIRI,
        typeIRI,
        schema,
        constructFetch,
        sparqlOptions,
      );
      if (result.length > 1) {
        throw new Error("Multiple documents found for entityIRI");
      } else if (result.length === 1) {
        const document = result[0];
        return remapLoadedDocument(document) as T;
      } else {
        return null;
      }
    },
    filterTypedDocuments: async <T = any>(
      typeName: string,
      options: TypedDocumentsSearchOptions<T> = {},
    ): Promise<T[]> => {
      const typeIRI = typeNameToTypeIRI(typeName);
      const schema = listSchemaForType(typeName);

      const { entityIRIs, ...restOptions } = options;

      const sparqlOptions: TypedFilterOptions<T> = {
        ...defaultFilterOptions,
        ...restOptions,
        defaultPrefix,
        queryBuildOptions,
        flavour: options.flavour ?? queryBuildOptions.sparqlFlavour,
        sparqlFeatures: queryBuildOptions.sparqlFeatures,
        maxRecursion:
          options.maxRecursion ?? defaultFilterOptions?.maxRecursion,
        walkerOptions: {
          ...walkerOptions,
          ...options.walkerOptions,
        },
      };

      const results = await filterTypedDocuments<T>(
        entityIRIs && entityIRIs.length > 0 ? entityIRIs : undefined,
        typeIRI,
        schema,
        constructFetch,
        sparqlOptions,
      );
      // CONSTRUCT has no LIMIT yet; honour TypedDocumentsSearchOptions.limit
      // with a post-fetch cap so filterMany({ limit }) matches the Store API.
      const capped =
        typeof options.limit === "number"
          ? results.slice(0, options.limit)
          : results;
      return statementMeta || effectiveMetaStamping
        ? capped.map((document) => remapLoadedDocument(document) as T)
        : capped;
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
  };

  const searchesProfile = features.blazegraphFulltextSearch
    ? ({
        mode: "fulltext",
        ranked: true,
      } as const)
    : ({
        mode: "substring",
        ranked: false,
      } as const);

  const store: SparqlStore<Record<string, unknown>> = {
    typeNameToTypeIRI,
    typeIRItoTypeName: (iri: string) => iri.replace(defaultPrefix, ""),
    storeId,
    capabilities: {
      identifies: true,
      loads: true,
      lists: true,
      flatResultSet: true,
      filters: true,
      searches: true,
      counts: true,
      writes: true,
      ...(statementMeta ? { statements: true as const } : {}),
      removes: true,
      streams: true,
      resolves: true,
      exists: true,
      speaksNative: true,
      profiles: {
        searches: searchesProfile,
        counts: { cost: "O(1)" },
        nestedPagination: { stage: nestedPaginationStage },
        sparqlFeatures: features,
        speaksNative: ["sparql"],
        ...(effectiveMetaStamping
          ? {
              entityMeta: resolveEntityMetaProfile(
                effectiveMetaStamping,
                "triples",
                "sparql",
              ),
            }
          : {}),
        ...(statementMeta
          ? {
              statementMeta: resolveStatementMetaProfile(statementEncoding),
            }
          : {}),
      },
    },
    subscribe: changeBus.subscribe,
    emit: changeBus.emit,

    loadOne: async (
      typeName: string,
      iri: string,
      options?: { withMeta?: boolean },
    ) => {
      const doc = await loadDocument(typeName, iri);
      if (options?.withMeta) {
        if (doc == null) return null;
        return {
          data: doc,
          provenance: {
            sources: [storeId],
            fetchedAt: new Date().toISOString(),
            freshness: "unknown",
          },
        };
      }
      return doc ?? null;
    },

    list: async (typeName, limit, query?) => {
      const pick = toSearchPick(query ?? undefined);
      return findDocumentsInner(typeName, limit, pick, undefined);
    },

    findDocumentsAsFlatResultSet: async (typeName, query, limit) => {
      if (!abstractDatastore.findDocumentsAsFlatResultSet) {
        throw new Error("findDocumentsAsFlatResultSet not available");
      }
      return abstractDatastore.findDocumentsAsFlatResultSet(
        typeName,
        query ?? {},
        limit,
      );
    },

    filterOne: async (typeName, entityIRI, options) => {
      if (!abstractDatastore.filterTypedDocument) {
        throw new Error("filterTypedDocument not available");
      }
      return abstractDatastore.filterTypedDocument(
        typeName,
        entityIRI,
        options as any,
      );
    },

    filterMany: async (typeName, options) => {
      if (!abstractDatastore.filterTypedDocuments) {
        throw new Error("filterTypedDocuments not available");
      }
      return abstractDatastore.filterTypedDocuments(typeName, options as any);
    },

    getEntitiesWithClassesByFilter: async (options) => {
      if (!abstractDatastore.getEntitiesWithClassesByFilter) {
        throw new Error("getEntitiesWithClassesByFilter not available");
      }
      return abstractDatastore.getEntitiesWithClassesByFilter(options as any);
    },

    searchByLabel: async (typeName, label, limit) => {
      if (!abstractDatastore.findDocumentsByLabel) {
        throw new Error("findDocumentsByLabel not available");
      }
      return abstractDatastore.findDocumentsByLabel(
        typeName,
        label,
        limit,
      ) as Promise<any[]>;
    },

    findEntityByTypeName: async (typeName, searchString, limit) => {
      if (!abstractDatastore.findEntityByTypeName) {
        throw new Error("findEntityByTypeName not available");
      }
      return abstractDatastore.findEntityByTypeName(
        typeName,
        searchString,
        limit,
      );
    },

    findDocumentsByAuthorityIRI: async (
      typeName,
      authorityIRI,
      repositoryIRI,
      limit,
    ) => {
      if (!abstractDatastore.findDocumentsByAuthorityIRI) {
        throw new Error("findDocumentsByAuthorityIRI not available");
      }
      return abstractDatastore.findDocumentsByAuthorityIRI(
        typeName,
        authorityIRI,
        repositoryIRI,
        limit,
      );
    },

    count: async (typeName, query) => {
      if (!abstractDatastore.countDocuments) {
        throw new Error("countDocuments not available");
      }
      return abstractDatastore.countDocuments(typeName, query);
    },

    upsert: async (typeName, entityIRI, document) => {
      const doc = await abstractDatastore.upsertDocument(
        typeName,
        entityIRI,
        document,
      );
      emitChange({
        entityIRI,
        changeType: "upsert",
        typeIRI: typeNameToTypeIRI(typeName),
        typeName,
        data: doc,
      });
      return doc;
    },

    ...(statementMeta
      ? {
          writeStatements: async (
            typeName: string,
            entityIRI: string,
            writes: StatementWrite[],
          ) => {
            for (const write of writes) {
              if (
                resolveStatementPolicy(
                  statementMeta.policies,
                  typeName,
                  write.path,
                ) !== "always"
              ) {
                throw new Error(
                  `writeStatements: no "always" statement policy for ${typeName}.${write.path}`,
                );
              }
            }

            if (statementEncoding === "rdf-12") {
              for (const write of writes) {
                const propIri = propertyIriFromPath(defaultPrefix, write.path);
                const hash = statementValueHash(write.value);
                await updateFetch(
                  withDefaultPrefix(
                    defaultPrefix,
                    buildRdf12StatementDelete(
                      entityIRI,
                      propIri,
                      write.path,
                      hash,
                    ),
                  ),
                );
                await updateFetch(
                  withDefaultPrefix(
                    defaultPrefix,
                    buildRdf12StatementInsert(
                      entityIRI,
                      propIri,
                      write.path,
                      write,
                    ),
                  ),
                );
              }
              const current =
                ((await loadDocument(typeName, entityIRI)) as Record<
                  string,
                  unknown
                > | null) ?? {};
              const merged = applyStatementWrites({ ...current }, writes);
              const truthyOnly = stripClientStatements(merged);
              const saved = await persistDocument(
                typeName,
                entityIRI,
                truthyOnly,
                { keepStatements: false },
              );
              emitChange({
                entityIRI,
                changeType: "upsert",
                typeIRI: typeNameToTypeIRI(typeName),
                typeName,
                data: saved,
              });
              return;
            }

            const current =
              ((await loadDocument(typeName, entityIRI)) as Record<
                string,
                unknown
              > | null) ?? {};
            const merged = applyStatementWrites({ ...current }, writes);
            const saved = await persistDocument(typeName, entityIRI, merged, {
              keepStatements: true,
            });
            emitChange({
              entityIRI,
              changeType: "upsert",
              typeIRI: typeNameToTypeIRI(typeName),
              typeName,
              data: saved,
            });
          },

          loadStatements: async (
            typeName: string,
            entityIRI: string,
            paths?: string[],
          ) => {
            if (statementEncoding === "rdf-12") {
              const targets =
                paths ??
                alwaysStatementPathsForType(statementMeta.policies, typeName);
              const query = withDefaultPrefix(
                defaultPrefix,
                buildRdf12StatementSelect(entityIRI, targets),
              );
              const raw = (await selectFetch(query, {
                withHeaders: true,
              })) as {
                results?: { bindings?: Record<string, { value: string }>[] };
              };
              return parseRdf12StatementBindings(raw.results?.bindings ?? []);
            }

            const doc = (await loadDocument(typeName, entityIRI)) as Record<
              string,
              unknown
            > | null;
            if (!doc) return {};

            const targets =
              paths ??
              alwaysStatementPathsForType(statementMeta.policies, typeName);
            const out: Record<
              string,
              ReturnType<typeof statementsForPath>
            > = {};
            for (const path of targets) {
              const rows = statementsForPath(doc, path);
              if (rows.length) out[path] = rows;
            }
            return out;
          },
        }
      : {}),

    remove: async (typeName, entityIRI) => {
      const res = await abstractDatastore.removeDocument(typeName, entityIRI);
      emitChange({
        entityIRI,
        changeType: "remove",
        typeIRI: typeNameToTypeIRI(typeName),
        typeName,
      });
      return res;
    },

    streamList: async function* (typeName, limit, query) {
      const pick = toSearchPick(query ?? undefined);
      const { iterable } = await findDocumentsIterable(typeName, limit, pick);
      for await (const doc of iterable as AsyncIterable<unknown>) {
        yield doc;
      }
    },

    importOne: async () => {
      throw new Error("Not implemented");
    },

    importMany: async () => {
      throw new Error("Not implemented");
    },

    resolveTypes: (entityIRI) => {
      if (!abstractDatastore.getClasses) {
        throw new Error("getClasses not available");
      }
      return abstractDatastore.getClasses(entityIRI);
    },

    exists: async (typeName, entityIRI) =>
      abstractDatastore.existsDocument(typeName, entityIRI),

    nativeQuery: async (lang, query, options) => {
      if (lang !== "sparql") {
        throw new Error(`Unsupported native query language: ${lang}`);
      }
      if (options !== undefined) {
        return selectFetch(query, options as Parameters<typeof selectFetch>[1]);
      }
      return selectFetch(query);
    },
  };

  return { store, abstractDatastore };
}

/**
 * Preferred entry point — capability-composed {@link SparqlStore}.
 */
export function initSPARQLStore(
  config: SPARQLDataStoreConfig,
): SparqlStore<Record<string, unknown>> {
  return initSPARQLDatastorePair(config).store;
}

/**
 * Legacy {@link AbstractDatastore} — use for contract tests and adapters not yet migrated to `Store`.
 */
export function initSPARQLAbstractDatastore(
  config: SPARQLDataStoreConfig,
): AbstractDatastore {
  return initSPARQLDatastorePair(config).abstractDatastore;
}
