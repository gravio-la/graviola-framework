import type {
  FulltextSearchStore,
  FulltextSearchStoreConfig,
  IndexIdCodec,
  JsonLdEntity,
  PrimaryStore,
  SearchDocumentsOptions,
  SearchDocumentsResult,
} from "@graviola/fulltext-search-core";
import {
  initFulltextSearchStore,
  isFulltextSearchStore,
  prepareFulltextIndexes,
} from "@graviola/fulltext-search-core";
import type { SchemaRegistry } from "@graviola/store-core";

import {
  createMeilisearchAdapter,
  type MeilisearchConfig,
} from "./adapters/meilisearch-adapter";

export type MeilisearchSparqlStoreConfig<
  R extends SchemaRegistry = SchemaRegistry,
> = Omit<FulltextSearchStoreConfig<R>, "adapter"> & {
  meilisearch: MeilisearchConfig;
};

export type MeilisearchSparqlStore<R extends SchemaRegistry = SchemaRegistry> =
  FulltextSearchStore<R>;

/**
 * Composite Meilisearch + primary store for schema-driven full-text search.
 */
export function initMeilisearchSparqlStore<R extends SchemaRegistry>(
  rawConfig: MeilisearchSparqlStoreConfig<R>,
): MeilisearchSparqlStore<R> {
  const adapter = createMeilisearchAdapter(rawConfig.meilisearch);

  return initFulltextSearchStore({
    ...rawConfig,
    adapter,
  });
}

export function isMeilisearchSparqlStore(
  store: unknown,
): store is MeilisearchSparqlStore {
  return isFulltextSearchStore(store as FulltextSearchStore);
}

export { prepareFulltextIndexes as prepareMeilisearchIndexes };

export type {
  FulltextSearchStoreConfig,
  IndexIdCodec,
  JsonLdEntity,
  PrimaryStore,
  SearchDocumentsOptions,
  SearchDocumentsResult,
  MeilisearchConfig,
};

export {
  createMeilisearchAdapter,
  buildMimeTypeFilter,
  renderMeiliFilter,
} from "./adapters/meilisearch-adapter";

// Re-export core symbols for consumers
export {
  buildRoutingPolicy,
  createPathSuffixIdCodec,
  encodeIriToDocId,
  decodeDocIdToIri,
  hitToJsonLd,
  isFulltextSearchStore,
  type RoutingPolicy,
} from "@graviola/fulltext-search-core";
