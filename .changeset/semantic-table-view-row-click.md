---
"@graviola/edb-table-types": patch
"@graviola/edb-table-components": minor
---

Add optional `onRowClick` to `SemanticTableView`. Resolve built-in show/edit row actions per row (not at table mount with an empty IRI). Restore `tableConfigRegistry.columnVisibility` on `SemanticTable`. Map table ui-schema scopes to `_single`, `_entity`, `_label_group`, and `IRI` column ids.
