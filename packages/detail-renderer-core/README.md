# `@graviola/edb-detail-renderer-core`

Headless **detail view** utilities: JSON Forms–compatible testers, ranked renderer selection, UISchema-tree dispatch, default UISchema generation (`TopLevelLayout` root), and two-layer chip resolution (`byTypeIRI` + tester registry).

**No MUI dependency** — safe for CLIs, Node, and non-React consumers that only need tester/registry logic.

## Tester API

Structural testers (`isEntityRef`, `isArrayOfEntityRefs`, …) and helpers (`typeIRIIs`, `typeNameIs`, `shapeHasProperty`) mirror `@jsonforms/core` (`rankWith`, `and`, `optionIs`, `formatIs`, …).

`typeIRIIs` reads `@type.const` from the JSON Schema via `extractTypeIRI`.  
`typeNameIs` uses `config.typeIRIToTypeName` on the JSON Forms tester context (pass `DetailTesterContext` as `config`).

## Override paths (apps using the full `<DetailRenderer>`)

1. **Tester rank** — `extraRenderers` / `overrideRenderers` on `DetailViewConfig`.
2. **Per-type config** — `typeIRIOverrides` / `typeNameOverrides` merging partial `DetailViewConfig`.
3. **UISchema maps** — `uiSchemata[typeName]` / `uiSchemataByTypeIRI[typeIRI]`.
4. **Per-control options** — JSON Forms `Control.options` on elements in the UISchema tree.

## Related packages

- `@graviola/edb-detail-renderer` — MUI bindings (`DetailRenderer`, chip components, layout renderers).
