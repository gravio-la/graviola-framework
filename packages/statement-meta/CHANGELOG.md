# @graviola/statement-meta

## 0.2.0

### Minor Changes

- 629d3f5: Configurable statement history retention (`all` by default, `latest`, `{ keepLast }`, per-path overrides). `@graviola/provenance-types` adds `compareStatementRecency` and `currentStatement`.

### Patch Changes

- 92d079e: Statement writes no longer multiply the statement history: old statement sidecar subgraphs are removed before re-persisting, and statement nodes are deduplicated per value (latest `generatedAt` wins).
- Updated dependencies [35bd287]
- Updated dependencies [629d3f5]
  - @graviola/json-schema-utils@1.8.0
  - @graviola/provenance-types@0.2.0
