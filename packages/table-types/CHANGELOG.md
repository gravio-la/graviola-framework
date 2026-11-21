# @graviola/edb-table-types

## 0.2.2

### Patch Changes

- 12c1ee4: Add optional `onRowClick` to `SemanticTableView`. Resolve built-in show/edit row actions per row (not at table mount with an empty IRI). Restore `tableConfigRegistry.columnVisibility` on `SemanticTable`. Map table ui-schema scopes to `_single`, `_entity`, `_label_group`, and `IRI` column ids.
  - @graviola/meta-schema@0.2.1

## 0.2.1

### Patch Changes

- Updated dependencies [ed91138]
  - @graviola/meta-schema@0.2.0

## 0.2.0

### Minor Changes

- 3fdd17b: Image parity for the JSON-LD table row shape. New `ImageValueRenderer` (selected structurally via `format: "uri"` + `contentMediaType: "image/*"`, or explicitly via `valueRenderer: "image"`) with `imageUriTester` in detail-renderer-core. The jsonld column registry gains a primary-column entry (`jsonld:primary`): the property declared as `primaryFields[typeName].label` now renders avatar + clickable label (opens the detail view), mirroring the sparql-select row shape. `TableTesterContext` carries an optional `primaryField` declaration and `SemanticTable` forwards it; jsonld primary column ordering fixed.

## 0.1.1

### Patch Changes

- fix version pinning issues

## 0.1.0

Initial release — table column contracts and registry types (spine package).
