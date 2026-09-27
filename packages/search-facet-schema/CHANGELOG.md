# @graviola/search-facet-schema

## 0.1.3

### Patch Changes

- Updated dependencies [35bd287]
  - @graviola/json-schema-utils@1.8.0

## 0.1.2

### Patch Changes

- d148ed6: Generalize full-text search: new engine-agnostic `@graviola/fulltext-search-core` with `FullTextSearchAdapter`, per-type routing, JSON-LD stubs, `prepareFulltextIndexes`, and `importAllSearchableTypes`. Meilisearch package is now a thin adapter; breaking removal of manifestation-specific APIs in favor of `searchDocuments(typeName, …)`. Adds pluggable `IndexIdCodec` (including legacy manifestation hex ids) and `existingIndexTypes` for attaching pre-populated indexes.

## 0.1.1

### Patch Changes

- fix version pinning issues
