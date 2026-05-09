# @graviola/edb-detail-renderer

## 0.3.0

### Minor Changes

- Extract headless detail-view logic into `@graviola/edb-detail-renderer-core` (JSON Forms UISchema tree dispatch, testers, chips resolution). The MUI package now wraps core with layout/control renderers including `TopLevelLayout` for header + body.

  **BREAKING**: `DetailUISchema` flat dot-path maps are replaced by JSON Forms `UISchemaElement` trees; use `generateDefaultDetailUISchema` with `skipScope` / `scopeOverride`.

  Export `extractTypeIRI` from `@graviola/json-schema-utils`.

### Patch Changes

- Updated dependencies
  - @graviola/edb-detail-renderer-core@0.2.0
  - @graviola/json-schema-utils@1.5.8
  - @graviola/edb-state-hooks@1.6.9
  - @graviola/edb-advanced-components@1.6.10
  - @graviola/edb-data-mapping@0.3.8
