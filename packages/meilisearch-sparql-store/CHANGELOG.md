# @graviola/meilisearch-sparql-store

## 0.2.1

### Patch Changes

- Updated dependencies
  - @graviola/edb-core-types@1.6.0
  - @graviola/fulltext-search-core@0.2.1
  - @graviola/store-core@0.3.2

## 0.2.0

### Minor Changes

- d148ed6: Generalize full-text search: new engine-agnostic `@graviola/fulltext-search-core` with `FullTextSearchAdapter`, per-type routing, JSON-LD stubs, `prepareFulltextIndexes`, and `importAllSearchableTypes`. Meilisearch package is now a thin adapter; breaking removal of manifestation-specific APIs in favor of `searchDocuments(typeName, …)`. Adds pluggable `IndexIdCodec` (including legacy manifestation hex ids) and `existingIndexTypes` for attaching pre-populated indexes.

### Patch Changes

- Updated dependencies [d148ed6]
  - @graviola/fulltext-search-core@0.2.0
  - @graviola/search-facet-schema@0.1.2
