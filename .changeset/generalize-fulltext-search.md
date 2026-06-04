---
"@graviola/fulltext-search-core": minor
"@graviola/meilisearch-sparql-store": minor
"@graviola/search-facet-schema": patch
---

Generalize full-text search: new engine-agnostic `@graviola/fulltext-search-core` with `FullTextSearchAdapter`, per-type routing, JSON-LD stubs, `prepareFulltextIndexes`, and `importAllSearchableTypes`. Meilisearch package is now a thin adapter; breaking removal of manifestation-specific APIs in favor of `searchDocuments(typeName, …)`. Adds pluggable `IndexIdCodec` (including legacy manifestation hex ids) and `existingIndexTypes` for attaching pre-populated indexes.
