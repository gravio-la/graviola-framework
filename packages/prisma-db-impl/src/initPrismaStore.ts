import type { JSONSchema7 } from "json-schema";
import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { AbstractDatastore, QueryType } from "@graviola/edb-global-types";
import {
  jsonSchema2PrismaFlatSelect,
  jsonSchema2PrismaSelect,
} from "@graviola/json-schema-prisma-utils";
import { defs } from "@graviola/json-schema-utils";
import { extendSchemaShortcut } from "@graviola/json-schema-utils";
import {
  applyMetaStampingOnWrite,
  deriveExtendedSchema,
  remapEntityMetaForPersistence,
  remapEntityMetaFromPersistence,
} from "@graviola/meta-schema";
import { createChangeBus } from "@graviola/store-core";
import type {
  BaseStore,
  Counts,
  EntityChangeEvent,
  Exists,
  FlatResultSet,
  Imports,
  Lists,
  Loads,
  ReadableImportSource,
  Removes,
  Resolves,
  StoreId,
  Writes,
} from "@graviola/store-core";

import { toJSONLD } from "./helper";
import { bindings2RDFResultSet } from "./helper/bindings2RDFResultSet";
import { importAllDocuments, importSingleDocument } from "./import";
import { toImportDatastoreAdapter } from "./import/toImportDatastoreAdapter";
import type { AbstractPrismaClient, PrismaStoreOptions } from "./types";
import { upsert } from "./upsert";

type PrismaSchemaRegistry = Record<string, unknown>;
type PrismaStore = BaseStore<PrismaSchemaRegistry> &
  Loads<PrismaSchemaRegistry> &
  Lists<PrismaSchemaRegistry> &
  FlatResultSet<PrismaSchemaRegistry> &
  Counts<PrismaSchemaRegistry> &
  Writes<PrismaSchemaRegistry> &
  Removes<PrismaSchemaRegistry> &
  Imports<PrismaSchemaRegistry> &
  Exists<PrismaSchemaRegistry> &
  Resolves;

export type PrismaDatastorePair = {
  store: PrismaStore;
  abstractDatastore: AbstractDatastore;
};

/** Prisma accepts `mode` on string filters only for some connectors. */
function prismaDatasourceSupportsStringMode(provider: string): boolean {
  const p = provider.toLowerCase();
  return ["postgresql", "postgres", "cockroachdb", "mongodb"].includes(p);
}

type PrismaContainsFilter = {
  contains: string;
  mode?: "insensitive";
};

function buildPrimaryLabelContainsFilter(
  searchString: string,
  likeInsensitive: boolean,
  datasourceProvider: string,
  onCaseSensitiveNotEnforceable: () => void,
): PrismaContainsFilter {
  const supportsMode = prismaDatasourceSupportsStringMode(datasourceProvider);

  if (likeInsensitive !== false) {
    if (supportsMode) {
      return { contains: searchString, mode: "insensitive" };
    } else {
      onCaseSensitiveNotEnforceable();
    }
  }

  return { contains: searchString };
}

/**
 * Initialize a prisma store with the given prisma client
 *
 * The schema and the prisma client must be compatible otherwise the store will not work as expected
 *
 * The store will use the jsonld context to convert the data to jsonld
 *
 *
 * @param prisma The prisma client to be used
 * @param rootSchema The root schema of the data
 * @param primaryFields The primary fields of the data (labels, descriptions, etc.)
 * @param jsonldContext The jsonld context to be used
 * @param options The options to be used
 * @param options.defaultPrefix The default prefix to be used
 * @param options.typeNameToTypeIRI A function to convert a type name to a type IRI
 * @param options.typeIRItoTypeName A function to convert a type IRI to a type name
 * @param options.idToIRI A function to convert an id to an IRI (if empty it is assumed that the id is already an IRI)
 * @param options.IRItoId A function to convert an IRI to an id (if empty it is assumed that the id is already an id)
 * @param options.allowUnknownNestedElementCreation Whether to allow unknown nested elements to be created
 * @param options.isAllowedNestedElement A function to check if a nested element is allowed to be created
 * @param options.datasourceProvider Prisma `datasource db` provider string (e.g. `sqlite`, `postgresql`)
 */

export function initPrismaDatastorePair<
  TPrisma extends AbstractPrismaClient = AbstractPrismaClient,
>(
  prisma: TPrisma,
  rootSchema: JSONSchema7,
  primaryFields: Partial<PrimaryFieldDeclaration>,
  {
    jsonldContext,
    defaultPrefix,
    typeNameToTypeIRI,
    typeIRItoTypeName,
    idToIRI,
    IRItoId,
    typeIsNotIRI,
    allowUnknownNestedElementCreation,
    allowNonTransactionalFallback,
    isAllowedNestedElement,
    maxRecursionDepth = 4,
    debug,
    datasourceProvider,
    metaStamping,
  }: PrismaStoreOptions,
): PrismaDatastorePair {
  const domainSchema = extendSchemaShortcut(rootSchema, "type", "id");
  const persistenceSchema = metaStamping
    ? deriveExtendedSchema(domainSchema)
    : domainSchema;
  const effectiveSchema = persistenceSchema;
  const primarySearchFilter = (
    searchString: string,
    likeInsensitive: boolean,
  ) =>
    buildPrimaryLabelContainsFilter(
      searchString,
      likeInsensitive,
      datasourceProvider,
      () => {
        //TODO: decide what to do here (warn/throw/ignore)
      },
    );
  const toJSONLDWithOptions = (entry: any) => {
    return toJSONLD(entry, new WeakSet(), {
      idToIRI,
      ...(typeIsNotIRI ? { typeNameToTypeIRI } : {}),
    });
  };
  const load = async (typeName: string, entityIRI: string) => {
    const select = jsonSchema2PrismaSelect(typeName, effectiveSchema, {
      maxRecursion: maxRecursionDepth,
    });
    const entry = await prisma[typeName].findUnique({
      where: {
        id: entityIRI,
      },
      select,
    });
    return toJSONLDWithOptions(entry);
  };

  const loadMany = async (typeName: string, limit?: number) => {
    const select = jsonSchema2PrismaSelect(typeName, effectiveSchema, {
      maxRecursion: maxRecursionDepth,
    });
    const entries = await prisma[typeName].findMany({
      take: limit,
      select,
    });
    return entries.map(toJSONLDWithOptions);
  };

  const loadManyFlat = async (
    typeName: string,
    queryOptions: QueryType,
    limit?: number,
    innerLimit?: number,
  ) => {
    const query = jsonSchema2PrismaFlatSelect(
      typeName,
      effectiveSchema,
      primaryFields,
      { takeLimit: innerLimit ?? limit ?? 0 },
    );
    const entries = await prisma[typeName].findMany({
      take: queryOptions.pagination?.pageSize ?? limit,
      skip: queryOptions.pagination?.pageIndex
        ? queryOptions.pagination.pageIndex *
          (queryOptions.pagination.pageSize ?? limit ?? 0)
        : 0,
      ...query,
    });
    return entries;
  };

  const searchMany = async (
    typeName: string,
    searchString: string,
    likeInsensitive: boolean,
    limit?: number,
  ) => {
    const select = jsonSchema2PrismaSelect(typeName, effectiveSchema, {
      maxRecursion: maxRecursionDepth,
    });
    const prim = primaryFields[typeName];
    if (!prim?.label) {
      throw new Error("No primary field found for type " + typeName);
    }
    const entries = await prisma[typeName].findMany({
      where: {
        [prim.label]: primarySearchFilter(searchString, likeInsensitive),
      },
      take: limit,
      select,
    });
    return entries.map(toJSONLDWithOptions);
  };
  const abstractDatastore: AbstractDatastore = {
    typeNameToTypeIRI: typeNameToTypeIRI,
    typeIRItoTypeName: typeIRItoTypeName,
    importDocument: (typeName, entityIRI, importStore) =>
      importSingleDocument(typeName, entityIRI, importStore, prisma, {
        IRItoId,
        typeNameToTypeIRI,
        typeIsNotIRI,
      }),
    importDocuments: (typeName, importStore, limit) =>
      importAllDocuments(typeName, importStore, prisma, limit, {
        IRItoId,
        typeNameToTypeIRI,
        typeIsNotIRI,
      }),
    loadDocument: async (typeName: string, entityIRI: string) => {
      const doc = await load(
        typeName,
        IRItoId ? IRItoId(entityIRI) : entityIRI,
      );
      return metaStamping && doc ? remapEntityMetaFromPersistence(doc) : doc;
    },
    findDocuments: async (typeName, query, limit, cb) => {
      const entries =
        query.search && query.search.length > 0
          ? await searchMany(
              typeName,
              query.search,
              query.insensitive !== false,
              limit,
            )
          : await loadMany(typeName, limit);
      if (cb) {
        for (const entry of entries) {
          await cb(entry);
        }
      }
      return entries;
    },
    existsDocument: async (typeName: string, entityIRI: string) => {
      const entry = await prisma[typeName].findUnique({
        where: {
          id: IRItoId ? IRItoId(entityIRI) : entityIRI,
        },
        select: {
          id: true,
        },
      });
      return Boolean(entry);
    },
    removeDocument: async (typeName: string, entityIRI: string) => {
      return await prisma[typeName].delete({
        where: {
          id: IRItoId ? IRItoId(entityIRI) : entityIRI,
        },
      });
    },
    upsertDocument: async (typeName: string, entityIRI, document: any) => {
      let doc = {
        ...document,
        "@id": entityIRI,
        "@type": typeNameToTypeIRI(typeName),
      };

      if (metaStamping) {
        const previousRaw = await load(typeName, entityIRI).catch(() => null);
        const previous =
          previousRaw != null
            ? remapEntityMetaFromPersistence(previousRaw)
            : null;
        doc = applyMetaStampingOnWrite(
          doc,
          typeName,
          persistenceSchema,
          metaStamping,
          previous,
        );
        doc = remapEntityMetaForPersistence(doc);
      }

      return await upsert(typeName, doc, {
        prisma,
        schema: effectiveSchema,
        jsonldContext,
        defaultPrefix,
        keepContext: false,
        allowUnknownNestedElementCreation,
        allowNonTransactionalFallback,
        isAllowedNestedElement,
        idToIRI,
        typeNameToTypeIRI,
        typeIRItoTypeName,
        typeIsNotIRI,
        debug,
      });
    },
    listDocuments: async (typeName: string, limit: number = 10, cb) => {
      const entries = await loadMany(typeName, limit);
      if (cb) {
        for (const entry of entries) {
          await cb(entry);
        }
      }
      return entries;
    },
    findDocumentsAsFlatResultSet: async (typeName, query, limit) => {
      const bindings = await loadManyFlat(typeName, query, limit, 2);
      return bindings2RDFResultSet(bindings);
    },
    findDocumentsByAuthorityIRI: async (
      typeName,
      authorityIRI,
      repositoryIRI,
      limit,
    ) => {
      const entries = await prisma[typeName].findMany({
        where: {
          idAuthority_id: authorityIRI,
        },
        select: {
          id: true,
        },
        take: limit,
      });

      return entries.map((e) => e.id);
    },
    findDocumentsByLabel: async (typeName, label, limit) => {
      const primaryFieldDeclaration = (primaryFields as any)?.[typeName];
      if (!primaryFieldDeclaration?.label) {
        throw new Error("No primary field found for type " + typeName);
      }
      const ids = await prisma[typeName].findMany({
        where: {
          [primaryFieldDeclaration.label]: label,
        },
        select: {
          id: true,
        },
        take: limit,
      });
      return ids.map((e) => e.id);
    },
    getClasses: async (entityIRI) => {
      //we will use a rather primitive way to get the classes in future we could create its own IRI<->Class index and use a prisma middleware to keep it up to date
      const definitions = defs(effectiveSchema);
      const allTypeNames = Object.keys(definitions);
      const classes: string[] = [];
      for (const typeName of allTypeNames) {
        try {
          const entry = await prisma[typeName].findUnique({
            where: {
              id: IRItoId ? IRItoId(entityIRI) : entityIRI,
            },
            select: {
              id: true,
            },
          });
          if (entry) {
            classes.push(typeNameToTypeIRI(typeName));
          }
        } catch (e) {
          if (debug) {
            console.error("Error while trying to get class for", e);
          }
        }
      }
      return classes;
    },
    countDocuments: async (typeName: string, query: QueryType = {}) => {
      const prim = primaryFields[typeName];
      if (!prim?.label) {
        throw new Error("No primary field found for type " + typeName);
      }

      if (query.search && query.search.length > 0) {
        return await prisma[typeName].count({
          where: {
            [prim.label]: primarySearchFilter(
              query.search,
              query.insensitive !== false,
            ),
          },
        });
      }

      return await prisma[typeName].count();
    },
  };

  const changeBus = createChangeBus();
  const storeId = `prisma:${datasourceProvider}` as StoreId;

  const emitChange = (event: EntityChangeEvent) => {
    changeBus.emit(event);
  };

  const store: PrismaStore = {
    typeNameToTypeIRI,
    typeIRItoTypeName,
    storeId,
    capabilities: {
      identifies: true,
      loads: true,
      lists: true,
      flatResultSet: true,
      counts: true,
      writes: true,
      removes: true,
      imports: true,
      resolves: true,
      exists: true,
      profiles: {
        counts: { cost: "O(1)" },
        ...(metaStamping
          ? { entityMeta: { encoding: "column" as const } }
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
      const doc = await abstractDatastore.loadDocument(typeName, iri);
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
    list: async (typeName: string, limit?: number, query?: QueryType) =>
      abstractDatastore.findDocuments(typeName, query ?? {}, limit),
    findDocumentsAsFlatResultSet: async (
      typeName: string,
      query?: QueryType,
      limit?: number,
    ) => {
      if (!abstractDatastore.findDocumentsAsFlatResultSet) {
        throw new Error("findDocumentsAsFlatResultSet not available");
      }
      return abstractDatastore.findDocumentsAsFlatResultSet(
        typeName,
        query ?? {},
        limit,
      );
    },
    count: async (
      typeName: string,
      query?: Pick<QueryType, "search" | "insensitive">,
    ) => {
      if (!abstractDatastore.countDocuments) {
        throw new Error("countDocuments not available");
      }
      return abstractDatastore.countDocuments(typeName, query);
    },
    upsert: async (typeName: string, entityIRI: string, document: any) => {
      const result = await abstractDatastore.upsertDocument(
        typeName,
        entityIRI,
        document,
      );
      emitChange({
        entityIRI,
        changeType: "upsert",
        typeIRI: typeNameToTypeIRI(typeName),
        typeName,
        data: result,
      });
      return result;
    },
    remove: async (typeName: string, entityIRI: string) => {
      const result = await abstractDatastore.removeDocument(
        typeName,
        entityIRI,
      );
      emitChange({
        entityIRI,
        changeType: "remove",
        typeIRI: typeNameToTypeIRI(typeName),
        typeName,
      });
      return result;
    },
    importOne: async (
      typeName: string,
      entityIRI: string,
      source: ReadableImportSource<PrismaSchemaRegistry>,
    ) => {
      const importStore = toImportDatastoreAdapter(
        source,
        typeNameToTypeIRI,
        typeIRItoTypeName,
      );
      await importSingleDocument(typeName, entityIRI, importStore, prisma, {
        IRItoId,
        typeNameToTypeIRI,
        typeIsNotIRI,
      });
      const loaded = await abstractDatastore.loadDocument(typeName, entityIRI);
      if (!loaded) {
        throw new Error(
          `Could not load imported document ${typeName}:${entityIRI} after importOne`,
        );
      }
      return loaded as Record<string, unknown>;
    },
    importMany: async (
      typeName: string,
      source: ReadableImportSource<PrismaSchemaRegistry>,
      limit: number,
    ) => {
      const importStore = toImportDatastoreAdapter(
        source,
        typeNameToTypeIRI,
        typeIRItoTypeName,
      );
      await importAllDocuments(typeName, importStore, prisma, limit, {
        IRItoId,
        typeNameToTypeIRI,
        typeIsNotIRI,
      });
      return (await abstractDatastore.listDocuments(typeName, limit)) as Record<
        string,
        unknown
      >[];
    },
    exists: async (typeName: string, entityIRI: string) =>
      abstractDatastore.existsDocument(typeName, entityIRI),
    resolveTypes: async (entityIRI: string) => {
      if (!abstractDatastore.getClasses) {
        return [];
      }
      return abstractDatastore.getClasses(entityIRI);
    },
  };

  return { store, abstractDatastore };
}

export function initPrismaStore<
  TPrisma extends AbstractPrismaClient = AbstractPrismaClient,
>(
  prisma: TPrisma,
  rootSchema: JSONSchema7,
  primaryFields: Partial<PrimaryFieldDeclaration>,
  options: PrismaStoreOptions,
): PrismaStore {
  return initPrismaDatastorePair(prisma, rootSchema, primaryFields, options)
    .store;
}

export function initPrismaAbstractDatastore<
  TPrisma extends AbstractPrismaClient = AbstractPrismaClient,
>(
  prisma: TPrisma,
  rootSchema: JSONSchema7,
  primaryFields: Partial<PrimaryFieldDeclaration>,
  options: PrismaStoreOptions,
): AbstractDatastore {
  return initPrismaDatastorePair(prisma, rootSchema, primaryFields, options)
    .abstractDatastore;
}
