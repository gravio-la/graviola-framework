# @graviola/fulltext-search-core

Engine-agnostic full-text search composite for Graviola stores.

## `FullTextSearchAdapter`

Single seam implemented by Meilisearch today; Elasticsearch, Solr, and client-only Lunr/MiniSearch later.

## Key exports

- `initFulltextSearchStore({ adapter, primaryStore, searchFacetSchema, schema, primaryFields, enrichEntityForIndex? })`
- `prepareFulltextIndexes` / `pushFulltextIndexes` — bootstrap / augment indexes from sidecar
- `diffFulltextIndexes` / `describeFulltextIndexes` — desired vs live settings + doc counts
- `clearFulltextIndexes` / `resetFulltextIndexes` — empty docs or delete indexes
- `populateFromStore` / `reindexFromStore` — fill from a primary Store (`import*`)
- `createCalcEnrichEntityForIndex(store)` — merge materialized calc values before projection
- `buildRoutingPolicy`, `hitToJsonLd`, `projectEntityToIndexDoc`
- `createInMemoryTextIndexAdapter()` — unit tests & reference in-memory engine

See `@graviola/meilisearch-sparql-store` for the Meilisearch wiring and `apps/fts-cli` for the Prisma-like CLI.
