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

/**
 * Adapts the app dataStore to the staging probe interface (staged-first, then main).
 *
 * Prefer native `findDocumentsByAuthorityIRI` (SPARQL owl:sameAs / sameAs / idAuthority).
 * Fall back to typed `filterMany` on schema `sameAs` when the native hook is missing
 * or throws (older REST shims).
 */
export const buildMainStoreProbe = (
  dataStore: CrudDatastoreStore | null | undefined,
): MainStoreProbe | undefined => {
  if (!dataStore) return undefined;

  const hasAuthority =
    typeof dataStore.findDocumentsByAuthorityIRI === "function";
  const hasFilterMany = typeof dataStore.filterMany === "function";
  if (!hasAuthority && !hasFilterMany && !dataStore.searchByLabel) {
    return undefined;
  }

  return {
    findDocumentsByAuthorityIRI:
      hasAuthority || hasFilterMany
        ? async (typeName, secondaryIRI, _authorityIRI) => {
            if (hasAuthority) {
              try {
                const results = await dataStore.findDocumentsByAuthorityIRI!(
                  typeName,
                  secondaryIRI,
                  _authorityIRI,
                );
                const iris = toEntityIRIs(results ?? []);
                if (iris.length > 0) return iris;
              } catch {
                // fall through to sameAs filter
              }
            }
            if (hasFilterMany) {
              try {
                const docs = await dataStore.filterMany!(typeName, {
                  where: { sameAs: { equals: secondaryIRI } },
                  select: { "@id": true },
                  limit: 10,
                } as never);
                return toEntityIRIs(docs ?? []);
              } catch {
                return [];
              }
            }
            return [];
          }
        : undefined,
    searchByLabel: dataStore.searchByLabel
      ? async (typeName, label, limit) => {
          try {
            const docs = await dataStore.searchByLabel!(typeName, label, limit);
            return docs as Array<{ ["@id"]?: string }>;
          } catch {
            return [];
          }
        }
      : undefined,
  };
};
