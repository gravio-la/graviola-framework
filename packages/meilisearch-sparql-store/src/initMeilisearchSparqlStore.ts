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
  createManifestationHexIdCodec,
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
  /** When set, used as the Meilisearch index uid for Manifestation (legacy single-index apps). */
  legacySingleIndex?: string;
  /**
   * Shorthand for semanticdesk / graviola-indexer indexes where document id is a hex digest
   * and the entity IRI is `{entityNs}manifestation/{hex}`.
   */
  legacyManifestationHexIds?: { entityNs: string };
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

  const indexNameForType =
    rawConfig.indexNameForType ??
    (rawConfig.legacySingleIndex
      ? (typeName: string) =>
          typeName === "Manifestation" ? rawConfig.legacySingleIndex! : typeName
      : undefined);

  let idCodec = rawConfig.idCodec;
  let idCodecForType = rawConfig.idCodecForType;
  if (rawConfig.legacyManifestationHexIds) {
    const legacyCodec = createManifestationHexIdCodec(
      rawConfig.legacyManifestationHexIds.entityNs,
    );
    idCodec = idCodec ?? legacyCodec;
    const prevForType = idCodecForType;
    idCodecForType = (typeName: string) =>
      prevForType?.(typeName) ??
      (typeName === "Manifestation" ? legacyCodec : undefined);
  }

  const existingIndexTypes =
    rawConfig.existingIndexTypes ??
    (rawConfig.legacySingleIndex ? ["Manifestation"] : undefined);

  return initFulltextSearchStore({
    ...rawConfig,
    adapter,
    indexNameForType,
    idCodec,
    idCodecForType,
    existingIndexTypes,
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
  createManifestationHexIdCodec,
  createPathSuffixIdCodec,
  encodeIriToDocId,
  decodeDocIdToIri,
  hitToJsonLd,
  isFulltextSearchStore,
  type RoutingPolicy,
} from "@graviola/fulltext-search-core";
