# `@graviola/edb-table-components`

Schema-driven data tables for the Graviola framework.

Provides two components at different tiers:

- **`SemanticTable`** — connected tier: reads `typeName` from the `AdbProvider` context, fetches paginated data from the configured store, resolves columns via the registry, and manages sort/filter state.
- **`SemanticTableView`** — presentation shell: pure props, no store dependency. Accepts pre-fetched `data`, `columns`, and pagination state. Use this directly in Storybook or when the data lifecycle is managed outside the component.

Both are built on `material-react-table`.

## Row shapes

`SemanticTable` supports two row shapes via the `rowShape` prop:

| `rowShape`                  | data source                    | column registry              |
| --------------------------- | ------------------------------ | ---------------------------- |
| `"sparql-select"` (default) | `findDocumentsAsFlatResultSet` | `sparqlSelectColumnRegistry` |
| `"jsonld"`                  | `filterTypedDocuments`         | `jsonLdColumnRegistry`       |

## Quick usage

```tsx
// Connected — needs AdbProvider in the tree
<SemanticTable
  typeName="Person"
  rowShape="jsonld"
  callbacks={{ onEditEntry: (id, typeIRI) => openEditor(id) }}
/>

// Shell — static data, no provider needed
<SemanticTableView
  typeName="Person"
  columns={myMrtColumns}
  data={rows}
  rowCount={rows.length}
  columnOrder={["name", "birthDate"]}
  pagination={{ pageIndex: 0, pageSize: 25 }}
  onPaginationChange={() => {}}
  sorting={[]}
  onSortingChange={() => {}}
  manualPagination={false}
/>
```

## Column configuration

Columns are resolved by a `TableColumnRegistry` (tester/renderer pairs ranked by score). Pass a custom or composed registry via `columnRegistry`. Override column layout declaratively with `tableUiSchema` (`TableUiSchema` from `@graviola/edb-table-types`).

## Action registry

Row and bulk actions are pluggable via `actionRegistry` (`TableActionRegistry`). Factory helpers `createMoveToTrashRowEntry` and `createMoveToTrashBulkEntry` are exported from `actions.ts`.

## Where this sits

This is an **integration layer** — it wires together the spine (`edb-table-types`) and the tissue registries (`edb-table-renderer-*`) into ready-to-use components. It re-exports everything from those packages so consumers need only one import.

## Related packages

- `@graviola/edb-table-types` — spine: `TableUiSchema`, `TableColumnRegistry`, tester/renderer contracts
- `@graviola/edb-table-mrt-adapter` — adapts `TableColumnDefFragment` → `MRT_ColumnDef`
- `@graviola/edb-table-renderer-sparql-select` — column registry for SPARQL SELECT rows
- `@graviola/edb-table-renderer-jsonld` — column registry for JSON-LD document rows
