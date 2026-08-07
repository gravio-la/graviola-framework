export type { SchemaRegistry, EntityOf } from "./registry";
export type { StoreId } from "./ids";
export type { ReadResult, ISO8601, FreshnessState } from "./envelope";
export type { PaginationState, StoreListQuery } from "./query";
export type {
  StoreFilterTraversalOptions,
  StoreDocumentsSearchOptions,
} from "./filter-options";

export type { Identifies } from "./capabilities/identifies";
export type { Loads } from "./capabilities/loads";
export type { Lists } from "./capabilities/lists";
export type { Filters } from "./capabilities/filters";
export type { Searches } from "./capabilities/searches";
export type { Counts } from "./capabilities/counts";
export type { Writes } from "./capabilities/writes";
export type { Statements } from "./capabilities/statements";
export type { Calc, CalcWarmResult } from "./capabilities/calc";
export type { Removes } from "./capabilities/removes";
export type { Streams } from "./capabilities/streams";
export type { Imports, ReadableImportSource } from "./capabilities/imports";
export type { TextSearches, TextSearchHit } from "./capabilities/text-searches";
export type {
  Aggregates,
  FacetResult,
  FacetBucket,
} from "./capabilities/aggregates";
export type { FlatResultSet } from "./capabilities/flat-result-set";
export type { SpeaksNative } from "./capabilities/speaks-native";
export type { Resolves } from "./capabilities/resolves";
export type { Exists } from "./capabilities/exists";

export type {
  CapabilityDescriptor,
  CapabilityName,
  CapabilityProfiles,
  SearchesProfile,
  CountsProfile,
  WritesProfile,
  StreamsProfile,
  EntityMetaProfile,
  StatementMetaProfile,
  NestedPaginationProfile,
} from "./descriptor";
export type {
  WriteDocumentContext,
  WriteDocumentInterceptor,
} from "./write-hooks";
export {
  noopWriteDocumentInterceptor,
  composeWriteDocumentInterceptors,
} from "./write-hooks";
export { hasCapabilityInDescriptor, speaksLanguage } from "./descriptor";
export type {
  CapabilityFacets,
  StoreWithCapability,
} from "./capability-guards";
export { hasCapability } from "./capability-guards";

export type { Simulator } from "./simulator";

export { createExistsFromLoads } from "./simulators/exists-from-loads";
export { createResolvesFromLoads } from "./simulators/resolves-from-loads";

export type {
  EntityChangeEvent,
  EntityRemoveEvent,
  EntityUpsertEvent,
  ChangeType,
  ChangeListener,
  Unsubscribe,
} from "./events";
export { createChangeBus } from "./events";

export type {
  BaseStore,
  SparqlStore,
  MinimalLookupStore,
  ReadOnlyStructuralStore,
} from "./store";
