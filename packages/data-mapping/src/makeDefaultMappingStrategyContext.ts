import type {
  IRIToStringFn,
  NormDataMappings,
  PrimaryFieldDeclaration,
} from "@graviola/edb-core-types";
import {
  createLogger,
  makeCreateDeeperContextFn,
} from "./makeCreateDeeperContextFn";
import type {
  AuthorityConfiguration,
  DeclarativeMapping,
  StrategyContext,
} from "./mappingStrategies";

/**
 * Minimal store interface required by makeDefaultMappingStrategyContext.
 * Subset of CrudDatastoreStore capabilities for authority resolution.
 */
export type MappingStoreProbe = {
  findDocumentsByAuthorityIRI?: (
    typeName: string,
    authorityIRI: string,
    repositoryIRI?: string,
    limit?: number,
  ) => Promise<any[]>;
  searchByLabel?: (
    typeName: string,
    label: string,
    limit: number,
  ) => Promise<any[]>;
};

/**
 * Creating a context for the mapping requires a lot of boilerplate code. Thus, this function is provided
 * to facilitate the creation of the context.
 *
 * the strategy context is a collection of functions and values that are used by the mapping strategies.
 *
 * @param dataStore the data store to use
 * @param createEntityIRI a function that creates a new IRI for an entity of a given type
 * @param typeIRItoTypeName a function that maps typeIRIs to type names
 * @param primaryFields the primary fields for all types that are used in the mapping
 * @param normDataMappings the mappings that are used to map norm data to the data store
 * @param authorityAccess the authority access configuration
 * @param disableLogging whether to disable logging
 * @param defaultAuthorityIRI default authority IRI for strategies that need one
 *   (no framework default — pass the authority your mappings target)
 */
export const makeDefaultMappingStrategyContext: (
  dataStore: MappingStoreProbe,
  createEntityIRI: (typeIRI: string) => string,
  typeIRIToTypeName: IRIToStringFn,
  primaryFields: PrimaryFieldDeclaration,
  normDataMappings?: NormDataMappings<DeclarativeMapping>,
  authorityAccess?: Record<string, AuthorityConfiguration>,
  disableLogging?: boolean,
  defaultAuthorityIRI?: string,
) => StrategyContext = (
  dataStore,
  createEntityIRI,
  typeIRItoTypeName,
  primaryFields,
  normDataMappings,
  authorityAccess,
  disableLogging = false,
  defaultAuthorityIRI,
) => ({
  getPrimaryIRIBySecondaryIRI: async (
    secondaryIRI: string,
    authorityIRI: string,
    typeIRI?: string | undefined,
  ) => {
    if (!typeIRI) {
      return null;
    }
    const typeName = typeIRItoTypeName(typeIRI);
    const finder = dataStore.findDocumentsByAuthorityIRI;
    if (!finder) {
      return null;
    }
    const ids = await finder(typeName, secondaryIRI, authorityIRI);
    if (ids.length > 0) {
      console.warn("found more then one entity");
    }
    return ids[0] || null;
  },
  searchEntityByLabel: async (
    label: string,
    typeIRI: string,
  ): Promise<string | null> => {
    const typeName = typeIRItoTypeName(typeIRI);
    if (!dataStore.searchByLabel) {
      return null;
    }
    const docs = await dataStore.searchByLabel(typeName, label, 10);
    if (docs.length > 0) {
      console.warn("found more then one entity");
    }
    const first = docs[0] as { ["@id"]?: string } | undefined;
    return (typeof first?.["@id"] === "string" ? first["@id"] : null) ?? null;
  },
  authorityAccess: authorityAccess,
  authorityIRI: defaultAuthorityIRI ?? "",
  newIRI: createEntityIRI,
  typeIRItoTypeName: typeIRItoTypeName,
  primaryFields: primaryFields,
  normDataMappings,
  path: [],
  logger: createLogger([], disableLogging),
  createDeeperContext: makeCreateDeeperContextFn(disableLogging),
});
