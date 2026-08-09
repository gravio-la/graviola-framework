export type {
  IndexSettings,
  IndexStats,
  IndexDocument,
  FacetFilter,
  FacetFilterEquality,
  FacetFilterRange,
  TextIndexQuery,
  TextIndexHit,
  TextIndexResult,
  FullTextSearchAdapter,
} from "./engine";

export { isFacetFilterRange } from "./engine";

export { INDEX_DOC_IRI, INDEX_DOC_TYPE } from "./constants";

export {
  encodeIriToDocId,
  decodeDocIdToIri,
  defaultIndexUid,
  defaultIndexIdCodec,
  createManifestationHexIdCodec,
  createPathSuffixIdCodec,
  pathSuffixFromIri,
  type IndexIdCodec,
} from "./id-mapping";

export {
  buildRoutingPolicy,
  getTypeRouting,
  isFulltextType,
  isFulltextProperty,
  isFacetProperty,
  resolveIndexField,
  propertyNameFromScope,
  typeFromScope,
  type RoutingPolicy,
  type TypeRouting,
  type FacetFieldSpec,
  type BuildRoutingPolicyOptions,
} from "./routing/build-routing-policy";

export {
  hitToJsonLd,
  mergeHydratedStub,
  type JsonLdEntity,
} from "./hit-to-jsonld";

export {
  projectEntityToIndexDoc,
  indexedPropertyNames,
} from "./project-entity";

export {
  prepareFulltextIndexes,
  settingsForType,
  type PrepareFulltextIndexesOptions,
  type PrepareFulltextIndexesResult,
  type TypeIndexSummary,
} from "./prepare/prepareFulltextIndexes";

export {
  diffIndexSettings,
  hasAnyDrift,
  type IndexSettingsDrift,
} from "./lifecycle/indexSettingsDiff";

export {
  diffFulltextIndexes,
  describeFulltextIndexes,
  pushFulltextIndexes,
  clearFulltextIndexes,
  resetFulltextIndexes,
  populateFromStore,
  reindexFromStore,
  type LifecycleBaseOptions,
  type TypeIndexDiff,
  type DiffFulltextIndexesResult,
  type DescribeFulltextIndexesResult,
  type PopulateFromStoreOptions,
  type PopulateFromStoreResult,
  type ReindexFromStoreOptions,
  type ReindexFromStoreResult,
} from "./lifecycle/lifecycle";

export { createCalcEnrichEntityForIndex } from "./enrich/createCalcEnrichEntityForIndex";

export {
  subscribeFulltextIndexSync,
  type FulltextIndexSyncHandle,
  type FulltextIndexSyncSource,
  type SubscribeFulltextIndexSyncOptions,
} from "./sync/subscribeFulltextIndexSync";

export {
  initFulltextSearchStore,
  isFulltextSearchStore,
  type FulltextSearchStore,
  type FulltextSearchStoreConfig,
  type PrimaryStore,
  type SearchDocumentsOptions,
  type SearchDocumentsResult,
} from "./initFulltextSearchStore";

export { createInMemoryTextIndexAdapter } from "./testing/in-memory-adapter";
