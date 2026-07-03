---
"@graviola/edb-detail-renderer-core": minor
"@graviola/edb-detail-renderer": minor
"@graviola/edb-table-types": minor
"@graviola/edb-table-renderer-jsonld": minor
"@graviola/edb-table-components": minor
---

Image parity for the JSON-LD table row shape. New `ImageValueRenderer` (selected structurally via `format: "uri"` + `contentMediaType: "image/*"`, or explicitly via `valueRenderer: "image"`) with `imageUriTester` in detail-renderer-core. The jsonld column registry gains a primary-column entry (`jsonld:primary`): the property declared as `primaryFields[typeName].label` now renders avatar + clickable label (opens the detail view), mirroring the sparql-select row shape. `TableTesterContext` carries an optional `primaryField` declaration and `SemanticTable` forwards it; jsonld primary column ordering fixed.
