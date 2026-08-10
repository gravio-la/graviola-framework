import type {
  IRIToStringFn,
  NormDataMappings,
  PrimaryFieldDeclaration,
} from "@graviola/edb-core-types";
import {
  type AuthorityConfiguration,
  type DeclarativeMapping,
  makeDefaultMappingStrategyContext as makeDefaultMappingStrategyContextBase,
  type StrategyContext,
} from "@graviola/edb-data-mapping";
import type { CrudDatastoreStore } from "@graviola/edb-state-hooks";

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
 * @deprecated Use makeDefaultMappingStrategyContext from @graviola/edb-data-mapping directly (Layer 1/2 compatible)
 */
export const makeDefaultMappingStrategyContext: (
  dataStore: CrudDatastoreStore,
  createEntityIRI: (typeIRI: string) => string,
  typeIRIToTypeName: IRIToStringFn,
  primaryFields: PrimaryFieldDeclaration,
  normDataMappings?: NormDataMappings<DeclarativeMapping>,
  authorityAccess?: Record<string, AuthorityConfiguration>,
  disableLogging?: boolean,
) => StrategyContext = makeDefaultMappingStrategyContextBase;
