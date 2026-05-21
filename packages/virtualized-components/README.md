# `@graviola/edb-virtualized-components`

**Graviola role:** flesh · ready-to-use MUI + Virtuoso list UI (not schema-driven)

Virtualized list components built on **MUI** and **react-virtuoso**. Use beside semantic forms and tables when you need a performant scrollable list without wiring a full schema-driven view.

## Exports

- `GenericVirtualizedList` — Virtuoso-backed list with optional header/footer slots
- `GenericMaterialListItem` — MUI list row (primary/secondary text, avatar, click handler)

## Peer dependencies

- `react`
- `@mui/material`, `@mui/icons-material`
- `react-virtuoso` ^4

## Related packages

- `@graviola/edb-ui-utils` — shared UI helpers (e.g. ellipsis)
- `@graviola/edb-table-components` — schema-driven tables (`SemanticTable`)
- `@graviola/edb-detail-renderer` — schema-driven read-only entity views
