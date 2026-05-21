# `@graviola/edb-table-mrt-adapter`

**Graviola role:** tissue · thin adapter between spine types and material-react-table

Thin **tissue** adapter that bridges `TableColumnDefFragment` (the framework-agnostic column type from `@graviola/edb-table-types`) to `Partial<MRT_ColumnDef>` from `material-react-table`.

```ts
import { adaptColumnFragmentToMrt } from "@graviola/edb-table-mrt-adapter";

const mrtCol = adaptColumnFragmentToMrt(fragment); // Partial<MRT_ColumnDef<TRow>>
```

This boundary exists so that the spine package (`edb-table-types`) carries no `material-react-table` dependency. Renderer packages produce `TableColumnDefFragment`; `SemanticTableView` calls `adaptColumnFragmentToMrt` at the last moment before passing columns to MRT.

If the table rendering layer is ever swapped for a different UI library, only this adapter package and `SemanticTableView` need to change.

## Related packages

- `@graviola/edb-table-types` — defines `TableColumnDefFragment`
- `@graviola/edb-table-components` — calls `adaptColumnFragmentToMrt` internally
