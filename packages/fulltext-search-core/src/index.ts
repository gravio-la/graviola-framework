export type {
  IndexSettings,
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
  type PrepareFulltextIndexesOptions,
  type PrepareFulltextIndexesResult,
  type TypeIndexSummary,
} from "./prepare/prepareFulltextIndexes";

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
