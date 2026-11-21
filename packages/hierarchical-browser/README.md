# `@graviola/hierarchical-browser`

Domain-agnostic hierarchical browse primitives for Graviola apps: lazy tree pane, browse layout, URL params, and a `ChildrenListingSource` contract.

Specialize at adapters (parent field names, type names, presentation). This package has no Semantic Desktop, file, or Meilisearch vocabulary in its public API.

## Exports

- `ChildrenListingSource` — `listRoots` / `listChildren` (+ optional `listExpandableChildren`)
- `useLazyChildren` — one React Query (infinite) per expanded parent
- `LazyTreePane` — controlled MUI `SimpleTreeView` with lazy load / load-more
- `HierarchicalBrowseLayout` — left tree + right content slots
- `useHierarchicalBrowseParams` — bookmarkable `root` / `selected` / `view` / `sort`
- `composeChildrenFirst` — merge two listings (containers then members)
- `createFilterManyChildrenSource` — Store `filterMany` baseline with IRI `{ "@id" }` equals, client-side sort, post-fetch limit, `rootsMode: "absentParent"` → `NOT EXISTS`
