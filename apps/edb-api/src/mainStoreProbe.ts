import type { AbstractDatastore } from "@graviola/edb-global-types";
import type { MainStoreProbe } from "@graviola/edb-import-staging";

const toEntityIRIs = (results: unknown[]): string[] =>
  results
    .map((item) => {
      if (typeof item === "string") return item;
      if (
        item &&
        typeof item === "object" &&
        typeof (item as { ["@id"]?: string })["@id"] === "string"
      ) {
        return (item as { ["@id"]: string })["@id"];
      }
      return null;
    })
    .filter((iri): iri is string => iri !== null);

/** Build main-store probe from AbstractDatastore (same shape as experiments-cli). */
export const buildMainStoreProbe = (
  dataStore: AbstractDatastore,
): MainStoreProbe | undefined => {
  if (!dataStore.findDocumentsByAuthorityIRI) return undefined;

  return {
    findDocumentsByAuthorityIRI: async (
      typeName,
      secondaryIRI,
      authorityIRI,
    ) => {
      const results = await dataStore.findDocumentsByAuthorityIRI!(
        typeName,
        secondaryIRI,
        authorityIRI,
      );
      return toEntityIRIs(results);
    },
    searchByLabel: dataStore.findDocumentsByLabel
      ? async (typeName, label, limit) => {
          const docs = await dataStore.findDocumentsByLabel!(
            typeName,
            label,
            limit,
          );
          return docs as Array<{ ["@id"]?: string }>;
        }
      : undefined,
  };
};

/** Wrap probe calls so Prisma schema/impl field mismatches degrade to empty results. */
export const buildSafeMainStoreProbe = (
  dataStore: AbstractDatastore,
): MainStoreProbe | undefined => {
  const base = buildMainStoreProbe(dataStore);
  if (!base) return undefined;

  return {
    findDocumentsByAuthorityIRI: async (...args) => {
      try {
        return (await base.findDocumentsByAuthorityIRI!(...args)) ?? [];
      } catch {
        return [];
      }
    },
    searchByLabel: base.searchByLabel
      ? async (...args) => {
          try {
            return (await base.searchByLabel!(...args)) ?? [];
          } catch {
            return [];
          }
        }
      : undefined,
  };
};
