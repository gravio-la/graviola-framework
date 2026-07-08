# @graviola/edb-table-renderer-jsonld

## 0.2.3

### Patch Changes

- Updated dependencies [184c8e9]
  - @graviola/edb-detail-renderer-core@0.5.0
  - @graviola/edb-detail-renderer@0.6.0
  - @graviola/edb-core-utils@1.6.1
  - @graviola/jsonld-utils@1.6.4
  - @graviola/edb-basic-components@1.5.5
  - @graviola/json-schema-utils@1.7.2
  - @graviola/edb-ui-utils@0.4.4

## 0.2.2

### Patch Changes

- Updated dependencies
  - @graviola/edb-core-utils@1.6.0
  - @graviola/edb-detail-renderer@0.5.2
  - @graviola/edb-detail-renderer-core@0.4.2
  - @graviola/jsonld-utils@1.6.3
  - @graviola/json-schema-utils@1.7.1
  - @graviola/edb-ui-utils@0.4.3
  - @graviola/edb-basic-components@1.5.4

## 0.2.1

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.7.0
  - @graviola/edb-detail-renderer@0.5.1
  - @graviola/edb-detail-renderer-core@0.4.1
  - @graviola/edb-ui-utils@0.4.2
  - @graviola/jsonld-utils@1.6.2
  - @graviola/edb-basic-components@1.5.3

## 0.2.0

### Minor Changes

- 3fdd17b: Image parity for the JSON-LD table row shape. New `ImageValueRenderer` (selected structurally via `format: "uri"` + `contentMediaType: "image/*"`, or explicitly via `valueRenderer: "image"`) with `imageUriTester` in detail-renderer-core. The jsonld column registry gains a primary-column entry (`jsonld:primary`): the property declared as `primaryFields[typeName].label` now renders avatar + clickable label (opens the detail view), mirroring the sparql-select row shape. `TableTesterContext` carries an optional `primaryField` declaration and `SemanticTable` forwards it; jsonld primary column ordering fixed.

### Patch Changes

- Updated dependencies [3fdd17b]
  - @graviola/edb-detail-renderer-core@0.4.0
  - @graviola/edb-detail-renderer@0.5.0
  - @graviola/edb-table-types@0.2.0
  - @graviola/edb-table-mrt-adapter@0.1.2
  - @graviola/edb-basic-components@1.5.2

## 0.1.2

### Patch Changes

- fix version pinning issues
- Updated dependencies
  - @graviola/edb-core-utils@1.5.8
  - @graviola/edb-detail-renderer@0.4.1
  - @graviola/edb-detail-renderer-core@0.3.1
  - @graviola/json-schema-utils@1.6.1
  - @graviola/jsonld-utils@1.6.1
  - @graviola/edb-table-mrt-adapter@0.1.1
  - @graviola/edb-table-types@0.1.1
  - @graviola/edb-ui-utils@0.4.1

## 0.1.1

### Patch Changes

- Updated dependencies
  - @graviola/edb-detail-renderer@0.4.0
  - @graviola/edb-detail-renderer-core@0.3.0
  - @graviola/edb-ui-utils@0.4.0
  - @graviola/json-schema-utils@1.6.0
  - @graviola/jsonld-utils@1.6.0
  - @graviola/edb-core-utils@1.5.7
