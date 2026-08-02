# CLAUDE.md — Graviola Storybook

Storybook is the **front-end book** for the Graviola framework: structural dispatch, semantic views, and copy-pasteable examples — not a dump of random architecture notes.

## Purpose

1. **Welcome** — Material-style dashboard (`StructuralDispatchDashboard`) showing six view families on a selectable example domain.
2. **Structural Dispatch** — Concept docs (MDX) + showcases with live Canvas and **code panel** enabled globally.
3. **Library Docs** — Non-UI packages (`sparql-schema`, `graph-traversal`, table).
4. **Packages / semantic-views** — Per-component stories; keep existing stories when adding docs.

## Directory layout

```
apps/storybook/stories/
├── Welcome.mdx                    # Embeds StructuralDispatchDashboard
├── _shared/                       # Domain registry + DomainProvider (not stories)
├── _dashboard/                    # Dashboard React (not stories)
├── structural-dispatch/           # Concept MDX + showcases/*.stories.tsx
├── packages/                      # Component stories (unchanged pattern)
├── library-docs/                  # Backend/query docs
└── architecture/                  # Read pipeline (de-emphasized in sort order)
```

## Example domains (`_shared/storyDomains.ts`)

| id             | Types                          | Schema source               |
| -------------- | ------------------------------ | --------------------------- |
| `item-catalog` | Item, Tag                      | `semanticViewsStorySchema`  |
| `product`      | Product                        | `valueRenderersStorySchema` |
| `relations`    | Manifestation, Realm, Artifact | `relationChipsStorySchema`  |

Add a domain: extend `storyDomains`, reuse or add fixtures under `packages/semantic-views/`, wire `DomainProvider`.

## Conventions for new stories

- **Read-only previews** (dashboard, concept pages): `*NoOps` from `@graviola/semantic-views` or `SemanticJsonFormNoOps` + `DomainProvider` / `withSemanticViewsProvider`. No Oxigraph unless the story is about CRUD.
- **Store-backed CRUD**: declare `withLocalOxigraph`, `withSparqlEndpoint`, or `withGraviolaProvider` on the story — never globally in `preview.tsx`.
- **Meta title**: use sidebar hierarchy — `Structural Dispatch/…`, `Packages/…`, `semantic-views/…`, `Library Docs/…`.
- **Tags**: `package-story` for component catalog; `requires-sparql` when a remote endpoint is required.
- **New renderer**: add a story under `Packages/` or `semantic-views/`, link from the matching Structural Dispatch MDX page, update the baseline renderers table in that MDX if it is a default.

## Decorators (`.storybook/decorators/`)

| Decorator                    | Use when                                    |
| ---------------------------- | ------------------------------------------- |
| `withSemanticViewsProvider`  | Item/Tag semantic-views stories             |
| `withRelationChipsProvider`  | Realm/Artifact/Manifestation                |
| `withValueRenderersProvider` | Product value renderers                     |
| `withGeoSampleData`          | Geo fixture + LocalOxigraph (typed filters) |
| `withGraviolaProvider`       | Full app + exhibition RDF (legacy)          |
| `withLocalOxigraph`          | In-browser graph without full Adb app shell |
| `withViewConfig`             | Override chip/list/card/detail options      |

Prefer `DomainProvider` + `storyDomains` for new cross-domain showcases.

## MDX (docs pages)

- **GFM tables** in `.mdx` require `remark-gfm` in `.storybook/main.ts` (`remarkPlugins` on `@storybook/addon-docs`). Do not use `@storybook/addon-mdx-gfm` (removed in Storybook 9+).
- **Mermaid** uses `mdx-mermaid` in the same `remarkPlugins` array.

## Commands

```bash
cd apps/storybook && bun run storybook      # dev :6006
cd apps/storybook && bun run build-storybook
cd apps/storybook && bun run build:pages    # ../../_site/storybook
```

## What not to do

- Do not add store providers globally in `preview.tsx`.
- Do not duplicate schema bodies — import from `packages/semantic-views/*.ts` or testapp schemas when extending domains.
- Do not remove legacy Architecture / exhibition stories without an explicit migration plan.
