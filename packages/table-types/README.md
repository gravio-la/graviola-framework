# `@graviola/edb-table-types`

**Graviola role:** spine · contracts only, no UI implementation

**Spine package** for the table subsystem — interfaces and contracts only, no implementation.

Defines the tester/renderer/registry pattern for schema-driven table columns, mirroring the JSON Forms dispatch model used in `@graviola/edb-detail-renderer-core`.

**No React, no MUI, no browser-only dependency.** Safe in CLIs, Bun runtimes, and server-side consumers.

## Core types

- `TableUiSchema` — declarative column configuration (`whitelist`/`blacklist` mode, per-column `scope`, `visibility`, `rendererHint`)
- `TableColumnDefFragment` — framework-agnostic column descriptor (accessor, header, sizing, sort/filter flags); renderer packages adapt this to `MRT_ColumnDef` or any other table library
- `TableColumnTester` / `TableColumnRenderer` / `TableColumnRegistry` — ranked dispatch: a tester scores a `(schema, scope, uiOptions, context)` tuple; the highest-ranking renderer wins
- `selectTableRenderer` — picks the winner; respects `rendererHint` for explicit overrides
- `composeTableRegistries` — merges multiple registries by concatenation

## Where this sits

This is a **spine** package in the sense of §6.4 of the Graviola architecture — it is versioned slowly, broadly depended on, and carries no implementation. Renderer packages (`edb-table-renderer-sparql-select`, `edb-table-renderer-jsonld`) and the adapter (`edb-table-mrt-adapter`) are the corresponding **tissue**.

## Related packages

- `@graviola/edb-table-mrt-adapter` — adapts `TableColumnDefFragment` → `MRT_ColumnDef`
- `@graviola/edb-table-renderer-sparql-select` — registry for SPARQL SELECT result rows
- `@graviola/edb-table-renderer-jsonld` — registry for plain JSON-LD document rows
- `@graviola/edb-table-components` — `SemanticTable` / `SemanticTableView` consuming all of the above
