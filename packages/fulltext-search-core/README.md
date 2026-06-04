# @graviola/fulltext-search-core

Engine-agnostic full-text search composite for Graviola stores.

## `FullTextSearchAdapter`

Single seam implemented by Meilisearch today; Elasticsearch, Solr, and client-only Lunr/MiniSearch later.

## Key exports

- `initFulltextSearchStore({ adapter, primaryStore, searchFacetSchema, schema, primaryFields })`
- `prepareFulltextIndexes({ adapter, … })` — bootstrap indexes from sidecar only
- `buildRoutingPolicy`, `hitToJsonLd`, `projectEntityToIndexDoc`
- `createInMemoryTextIndexAdapter()` — unit tests & reference in-memory engine

See `@graviola/meilisearch-sparql-store` for the Meilisearch wiring and e2e tests.
