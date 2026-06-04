export type { MeilisearchConfig } from "./adapters/meilisearch-adapter";

export {
  createMeilisearchAdapter,
  buildMimeTypeFilter,
  renderMeiliFilter,
  searchMeilisearch,
} from "./adapters/meilisearch-adapter";

export {
  initMeilisearchSparqlStore,
  isMeilisearchSparqlStore,
  prepareMeilisearchIndexes,
  type MeilisearchSparqlStore,
  type MeilisearchSparqlStoreConfig,
  type PrimaryStore,
  type JsonLdEntity,
  type SearchDocumentsOptions,
  type SearchDocumentsResult,
} from "./initMeilisearchSparqlStore";

export {
  buildRoutingPolicy,
  encodeIriToDocId,
  decodeDocIdToIri,
  hitToJsonLd,
  isFulltextSearchStore,
  initFulltextSearchStore,
  prepareFulltextIndexes,
  type RoutingPolicy,
  type FulltextSearchStore,
  type FulltextSearchStoreConfig,
} from "@graviola/fulltext-search-core";
