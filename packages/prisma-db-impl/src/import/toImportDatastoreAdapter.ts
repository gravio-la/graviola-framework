import type { AbstractDatastore } from "@graviola/edb-global-types";
import type { ReadableImportSource } from "@graviola/store-core";

type PrismaSchemaRegistry = Record<string, unknown>;

type ListCapableSource = ReadableImportSource<PrismaSchemaRegistry> & {
  list?: (
    typeName: string,
    limit?: number,
    query?: unknown,
  ) => Promise<unknown[]>;
};

/**
 * Temporary migration bridge: adapts a Store-core `ReadableImportSource` to the
 * legacy `AbstractDatastore` shape expected by the existing Prisma import helpers.
 * Only methods required by import traversal are implemented; other methods fail fast.
 */
export function toImportDatastoreAdapter(
  source: ReadableImportSource<PrismaSchemaRegistry>,
  typeNameToTypeIRI: (typeName: string) => string,
  typeIRItoTypeName: (iri: string) => string,
): AbstractDatastore {
  const withList = source as ListCapableSource;

  return {
    typeNameToTypeIRI,
    typeIRItoTypeName,
    importDocument: async () => {
      throw new Error(
        "importDocument is not available on import source adapter",
      );
    },
    importDocuments: async () => {
      throw new Error(
        "importDocuments is not available on import source adapter",
      );
    },
    loadDocument: async (typeName: string, entityIRI: string) =>
      source.loadOne(typeName, entityIRI),
    existsDocument: async () => {
      throw new Error(
        "existsDocument is not available on import source adapter",
      );
    },
    removeDocument: async () => {
      throw new Error(
        "removeDocument is not available on import source adapter",
      );
    },
    upsertDocument: async () => {
      throw new Error(
        "upsertDocument is not available on import source adapter",
      );
    },
    listDocuments: async (typeName: string, limit?: number, cb?) => {
      if (typeof withList.list !== "function") {
        throw new Error(
          "listDocuments is not available on import source adapter",
        );
      }
      const rows = (await withList.list(typeName, limit)) as unknown[];
      if (cb) {
        for (const doc of rows) {
          await cb(doc);
        }
      }
      return rows;
    },
    findDocuments: async () => {
      throw new Error(
        "findDocuments is not available on import source adapter",
      );
    },
    getClasses: async (entityIRI: string) => {
      if (
        "resolveTypes" in source &&
        typeof source.resolveTypes === "function"
      ) {
        return source.resolveTypes(entityIRI);
      }
      throw new Error(
        "resolveTypes is required for imports when class lookup is needed",
      );
    },
  };
}
