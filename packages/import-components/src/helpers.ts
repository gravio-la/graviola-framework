import type { CrudDatastoreStore } from "@graviola/edb-state-hooks";
import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type {
  MainStoreProbe,
  StagedEntity,
} from "@graviola/edb-import-staging";
import type { IRIToStringFn } from "@graviola/edb-core-types";

export const propertyToIRI = (baseIRI: string, name: string) =>
  `${baseIRI}${name}`;

export const labelForEntity = (
  entity: StagedEntity,
  typeIRItoTypeName: IRIToStringFn,
  primaryFields: PrimaryFieldDeclaration,
): string => {
  const typeName = typeIRItoTypeName(entity.typeIRI);
  const field = primaryFields[typeName]?.label ?? "title";
  const value = entity.document[field];
  if (typeof value === "string" && value.length > 0) return value;
  return entity.entityIRI;
};

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

/** Adapts the app dataStore to the staging probe interface (staged-first, then main). */
export const buildMainStoreProbe = (
  dataStore: CrudDatastoreStore | null | undefined,
): MainStoreProbe | undefined => {
  if (!dataStore?.findDocumentsByAuthorityIRI) return undefined;

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
    searchByLabel: dataStore.searchByLabel
      ? async (typeName, label, limit) => {
          const docs = await dataStore.searchByLabel!(typeName, label, limit);
          return docs as Array<{ ["@id"]?: string }>;
        }
      : undefined,
  };
};
