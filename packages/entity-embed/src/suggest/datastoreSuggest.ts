import { defs } from "@graviola/json-schema-utils";

import type {
  EntitySuggestCandidate,
  EntitySuggestOptions,
  EntitySuggestProvider,
} from "../types";

type DatastoreLike = {
  filterMany?: (
    typeName: string,
    options?: { searchString?: string; limit?: number },
  ) => Promise<unknown[]>;
  searchByLabel?: (
    typeName: string,
    label: string,
    limit?: number,
  ) => Promise<unknown[]>;
};

type AdbLike = {
  schema: { definitions?: Record<string, unknown> };
  typeNameToTypeIRI: (name: string) => string;
};

let adbRef: AdbLike | null = null;
let storeRef: DatastoreLike | null = null;

/** Wire Adb + datastore for the fallback suggest provider (call from a hook). */
export function bindDatastoreSuggest(adb: AdbLike, store: DatastoreLike) {
  adbRef = adb;
  storeRef = store;
}

export function createDatastoreEntitySuggestProvider(): EntitySuggestProvider {
  return {
    async suggest(query, options?: EntitySuggestOptions) {
      const store = storeRef;
      const adb = adbRef;
      if (!store || !adb) {
        return [];
      }

      const limit = options?.limit ?? 8;
      const typeNames =
        options?.typeNames ??
        Object.keys(defs(adb.schema as never)).filter(
          (name) => name !== "Document",
        );

      const results: EntitySuggestCandidate[] = [];

      await Promise.all(
        typeNames.map(async (typeName) => {
          try {
            const perType = Math.ceil(limit / typeNames.length) + 1;
            const docs = store.filterMany
              ? await store.filterMany(typeName, {
                  searchString: query,
                  limit: perType,
                })
              : store.searchByLabel
                ? await store.searchByLabel(typeName, query, perType)
                : [];
            for (const doc of docs as Record<string, unknown>[]) {
              const entityIRI = String(doc["@id"] ?? "");
              if (!entityIRI) continue;
              const labelField =
                (doc.name as string | undefined) ??
                (doc.title as string | undefined) ??
                entityIRI.split("/").pop() ??
                entityIRI;
              results.push({
                entityIRI,
                typeName,
                typeIRI: adb.typeNameToTypeIRI(typeName),
                label: String(labelField),
              });
            }
          } catch {
            // type may not support search on this backend
          }
        }),
      );

      return results.slice(0, limit);
    },
  };
}
