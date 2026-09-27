# @graviola/fulltext-search-core

## 0.3.0

### Minor Changes

- 427ce4c: Calc enrichment uses the typed `Calc` facet, respects `calc.rootTypes` and passes the entity type.

### Patch Changes

- Updated dependencies [c449419]
- Updated dependencies [f4f4667]
- Updated dependencies [629d3f5]
- Updated dependencies [cd5f266]
- Updated dependencies [ae0c83e]
  - @graviola/store-core@0.4.0
  - @graviola/edb-core-types@1.8.0
  - @graviola/typed-query-types@0.4.0
  - @graviola/search-facet-schema@0.1.3

## 0.2.2

### Patch Changes

- Updated dependencies [184c8e9]
  - @graviola/edb-core-types@1.7.0
  - @graviola/store-core@0.3.3

## 0.2.1

### Patch Changes

- Updated dependencies
  - @graviola/edb-core-types@1.6.0
  - @graviola/store-core@0.3.2

## 0.2.0

### Minor Changes

- d148ed6: Generalize full-text search: new engine-agnostic `@graviola/fulltext-search-core` with `FullTextSearchAdapter`, per-type routing, JSON-LD stubs, `prepareFulltextIndexes`, and `importAllSearchableTypes`. Meilisearch package is now a thin adapter; breaking removal of manifestation-specific APIs in favor of `searchDocuments(typeName, …)`. Adds pluggable `IndexIdCodec` (including legacy manifestation hex ids) and `existingIndexTypes` for attaching pre-populated indexes.

### Patch Changes

- Updated dependencies [d148ed6]
  - @graviola/search-facet-schema@0.1.2
