# CLAUDE.md — Graviola CRUD Framework

> Priming reference for planning and implementation agents (and for Claude web project threads). For the _why_ behind the design, read the **[Graviola conceptual documentation](https://gravio-la.github.io/graviola-concept-documentation/)** book first; this file is the _what_ and the _where_.

---

## Project Purpose

Graviola is a **schema-driven semantic CRUD framework** in TypeScript. Its central runtime artifact is a **JSON Schema** (or a Zod schema from which JSON Schema is derived) describing the shape of domain entities. From that schema the framework derives, at runtime:

1. **Forms** — JSON Forms-based UI generated from the schema, with a renderer registry dispatching by schema shape.
2. **Tables** — `SemanticTable` renders filterable, sortable, paginated tables driven by the same schema.
3. **Detail views** — `DetailRenderer` produces read-only entity representations (cells, chips, cards, full pages) via a UISchema-tree dispatch.
4. **Queries** — JSON Schema → SPARQL CONSTRUCT/SELECT, JSON Schema → Prisma operations, or REST patterns.
5. **Validation** — Ajv against the same schema.
6. **Mappings** — declarative, JSON-LD-flavored transformations from external authority sources (Wikidata, GND, DBpedia) into the local model.

The framework is **storage-agnostic**: the same schemas, forms, tables, and queries operate against an in-browser Oxigraph (WebAssembly), a remote SPARQL endpoint (Fuseki, Blazegraph, GraphDB, Virtuoso), a Prisma-backed relational store (SQLite, PostgreSQL, MariaDB, MongoDB), a REST API, or an in-memory Zustand store.

A **declarative mapping layer** is the most production-tested non-CRUD subsystem; it is currently used to ingest authority records into local schemas in cultural heritage applications.

JSON Schema may be authored by hand or **generated upstream in the application build** (for example from [LinkML](https://linkml.io/)). The runtime sees the same artifact shapes either way and takes no LinkML dependency.

---

## Conceptual primer (load-bearing properties)

The following are not stylistic preferences; they constrain what does and does not belong in the framework.

- **JSON Schema is the runtime single source of truth.** The form, the table, the detail view, the SPARQL query, the validator, and the type definitions all derive from it. The schema travels with the data.
- **Storage-agnostic core.** A concrete `AbstractDatastore` implementation supplies CRUD; the rest of the framework programs against the interface in `@graviola/edb-global-types`. Implementations: SPARQL (over Oxigraph / remote endpoints), Prisma, REST, in-memory, plus a contract test suite (`apps/datastore-tests`).
- **Browser/server symmetry.** The foundation and schema-to-query layers (Layer 1, Layer 2 below) **must run identically in browser and on Bun**. They are consumed by command-line tools (`@graviola/edb-cli-creator`, `apps/json-schema-cli`, `apps/test-prisma-cli`) and the `apps/datastore-tests` Bun test suite. **Adding React, MUI, or any browser-only dependency to those layers is a breaking change** even if no test fails.
- **Structural dispatch.** UI rendering, mapping, validation, and lens application are bound to the **shape** declared by a schema (or a property carried by an entity), not to a nominal type. JSON Forms exemplifies the pattern at field level; Graviola extends it to detail views, chips, mappings.
- **Scope vs. binding path.** A _scope_ (`#/properties/birthDate`) is a JSON Pointer into a **schema document** — TBox. A _binding path_ (`patch.lane.owner.id`) is a runtime traversal of **instance data** shaped by the schema — ABox. Renderers, testers, and UI schema use scopes. Calculated-field formulas, mapping selectors, and data extractors use binding paths. Confusing the two is a category error.
- **Reasoning-compatible, reasoner-optional.** Conceptual model is description-logic-shaped (property-driven class derivation, transitive `sameAs`, `x-inverseOf`), but the framework ships no reasoner. Inference, where required, is delegated to the underlying store or to application code.
- **Local-first by default.** The in-browser Oxigraph backend is a first-class deployment target, not a demo mode. Servers — when present — are transports/accelerators, not authorities.
- **Reuse before reinvent.** Prefer `lodash-es` and Layer 1 helpers (`json-schema-utils`, `typed-query-types`, `edb-core-utils`) over local copies. No demo-domain heuristics in library packages; shared fixtures live in private fixture packages as `devDependency`. See Development Conventions.

---

## Repository Structure

```
graviola-framework/
├── packages/                       # ~50 publishable library packages (@graviola/*)
│   ├── form-renderer/              # JSON Forms renderer sub-workspace
│   │   ├── basic-renderer/
│   │   ├── color-picker-renderer/
│   │   ├── layout-renderer/
│   │   ├── linked-data-renderer/
│   │   ├── map-libre-gl-renderer/
│   │   └── markdown-renderer/
│   ├── ideas/                      # Experimental / incubating sub-workspace
│   │   ├── charts/
│   │   ├── resizable-drawer/
│   │   └── type-experiments/
│   ├── tsconfig/                   # Shared TS configurations
│   ├── tsup-config/                # Shared tsup configurations
│   ├── eslint-config-edb/          # Shared ESLint configuration
│   └── ...                         # Core packages (see "Core Package Architecture")
├── apps/
│   ├── testapp/                    # ← PRIMARY example app (Vite + React + LocalOxigraph)
│   ├── storybook/                  # Storybook 10 + Vitest browser tests (Playwright)
│   ├── datastore-tests/            # Contract tests for AbstractDatastore implementations (Bun)
│   ├── json-schema-cli/            # JSON Schema utilities CLI
│   └── test-prisma-cli/            # Prisma adapter playground CLI
├── _templates/                     # Hygen code-generation templates (edb/, generator/, init/)
├── _site/                          # Aggregated Pages output (storybook + typedoc + testapp)
├── prisma/                         # Generated Prisma schema files
├── docker/                         # (Per-app) Compose services live with the app that needs them
├── .changeset/                     # Changesets for versioning
├── flake.nix                       # Two Nix dev shells (Prisma 6, Prisma 7)
└── preview-pages.sh                # Local preview of the combined Pages site
```

> **Note:** `apps/edb-api/` and `apps/edb-cli/` directories exist but contain no source today. Domain-specific SLUB applications and schemas live in a separate repository. The canonical example in this repo is `apps/testapp`.
>
> **Note:** `packages/indexeddb-store-provider/` and `packages/indexeddb-dataset/` are inactive (no source); do not add them as dependencies.

---

## Monorepo Tooling

| Tool                 | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| **Bun** (≥ 1.3.10)   | Package manager, runtime, test runner                 |
| **Turborepo**        | Build orchestration and caching                       |
| **tsup**             | Per-package TypeScript bundler (dual CJS + ESM)       |
| **TypeScript** ≥ 5.8 | Strict mode, target ES2022                            |
| **Changesets**       | Version management and changelog generation           |
| **Hygen**            | Templates under `_templates/` for new packages        |
| **TypeDoc**          | API documentation (typedoc.json, typedoc.pages.json)  |
| **Storybook 10**     | Component playground; tests via Vitest + Playwright   |
| **Nix flake**        | Reproducible dev shell, two variants for Prisma 6 / 7 |

### Common commands

```bash
# Install dependencies (workspace catalog protocol; bun ≥ 1.3.10)
bun install

# Build all packages and apps (turbo, dependency-ordered)
bun run build

# Build only library packages (fastest path for dev)
bun run build:packages

# Run the testapp (canonical example)
bun run dev:testapp                  # === turbo run dev --filter='./apps/testapp'

# Run Storybook
bun run dev:storybook

# Watch-build all library packages (parallel)
bun run dev:packages

# Watch-build only the form-renderer sub-workspace
bun run dev:form-renderer

# Run all tests (turbo)
bun run test

# Datastore contract tests (against Oxigraph + Prisma/SQLite by default)
cd apps/datastore-tests && bun test

# Lint / format / depcheck
bun run lint
bun run lint:fix
bun run format
bun run depcheck

# Add a changeset before publishing
bun run changeset

# Release (builds first; runs sequentially via turbo concurrency 1)
bun run release

# TypeDoc (combined; pages variant)
bun run docs
bun run docs:pages

# Preview the combined Pages site locally
./preview-pages.sh                    # or `pages-preview` inside the Nix dev shell
```

---

## Package Naming Conventions

All packages publish under the `@graviola/` scope. Most use the `edb-` prefix (legacy: "entity database"), with documented exceptions.

- `@graviola/edb-*` — Core framework packages
- `@graviola/edb-*-renderer` — JSON Forms renderer packages (under `packages/form-renderer/`)
- `@graviola/semantic-*` — High-level semantic UI packages
- `@graviola/sparql-*` — SPARQL query / store packages
- `@graviola/json-schema-*` — JSON Schema utility packages
- `@graviola/*-db-impl` — Concrete `AbstractDatastore` implementations
- `@graviola/*-store-provider` — React store providers wrapping a `*-db-impl`

**Naming exceptions to be aware of** (the published name does _not_ match the folder name in obvious ways):

| Folder                                          | Published name                                       |
| ----------------------------------------------- | ---------------------------------------------------- |
| `packages/graph-traversal/`                     | `@graviola/edb-graph-traversal`                      |
| `packages/remote-query/`                        | `@graviola/remote-query-implementations`             |
| `packages/jsonSchema2PrismaSchema/`             | `@graviola/json-schema2prisma-schema`                |
| `packages/data-mapping-hooks/`                  | `@graviola/data-mapping-hooks` (no `edb-` prefix)    |
| `packages/form-renderer/color-picker-renderer/` | `@graviola/color-picker-renderer` (no `edb-` prefix) |
| `packages/form-renderer/map-libre-gl-renderer/` | `@graviola/map-libre-gl-renderer` (no `edb-` prefix) |
| `packages/eslint-config-edb/`                   | `eslint-config-edb` (unscoped, legacy)               |

### Internal workspace dependencies use `workspace:*`:

```json
"@graviola/edb-core-types": "workspace:*"
```

### Shared dependency versions use Bun's catalog protocol:

```json
"react": "catalog:",
"@mui/material": "catalog:mui",
"@jsonforms/core": "catalog:jsonforms",
"@prisma/client": "catalog:prisma",
"@rdfjs/data-model": "catalog:rdf"
```

Catalogs are defined in the root `package.json` under `workspaces.catalog` (default) and `workspaces.catalogs.{prisma,mui,rdf,jsonforms}`.

---

## Core Package Architecture

The framework is layered. Each layer consumes only from layers below it.

### Layer 1 — Foundation (no framework deps)

| Package                         | Purpose                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@graviola/edb-core-types`      | TypeScript definitions: RDF/SPARQL terms, prefixes, walker options, typed-filter base types                                                                 |
| `@graviola/edb-core-utils`      | IRI encoding/decoding, URL utilities, helpers                                                                                                               |
| `@graviola/edb-global-types`    | **`AbstractDatastore` interface contract** (legacy) + query/sort/search/pagination types                                                                    |
| `@graviola/store-core`          | **`Store<R>` capability interfaces**, `ReadResult`, descriptors, simulators (successor seam; Layer 1, no React)                                             |
| `@graviola/search-facet-schema` | `SearchFacetSchema` types + AJV loader for FTS/facets (Layer 1, no React)                                                                                   |
| `@graviola/typed-query-types`   | Recursive Prisma-style query types (`TypedWhereInput`, …) shared by Store Filters and graph traversal                                                       |
| `@graviola/json-schema-utils`   | JSON Schema manipulation (`bringDefinitionToTop`, `$ref` resolve, `definitionScope` / `definitionNameFromScope`, `stripXCalcProperties`, CBD boundaries, …) |
| `@graviola/jsonld-utils`        | JSON-LD ↔ RDF conversion utilities                                                                                                                          |
| `@graviola/edb-build-helper`    | Build / dependency analysis helpers (`get-dependencies.js`)                                                                                                 |
| `@graviola/edb-config-helper`   | Configuration helpers                                                                                                                                       |
| `@graviola/edb-tsconfig`        | Shared `tsconfig` bases                                                                                                                                     |
| `@graviola/edb-tsup-config`     | Shared `tsup` configurations                                                                                                                                |

> **Layer 1 + Layer 2 constraint:** these packages **must never take on React, MUI, or any browser/frontend dependencies**. They are consumed from Bun in CLIs (`@graviola/edb-cli-creator`, `apps/json-schema-cli`) and contract tests (`apps/datastore-tests`). Frontend dependencies here would silently break server consumers.

### Layer 2 — Schema → Query Translation

| Package                                  | Purpose                                                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `@graviola/sparql-schema`                | **JSON Schema → SPARQL** (CONSTRUCT, SELECT, INSERT, DELETE, soft-delete, typed filters with optional Zod inference) |
| `@graviola/edb-graph-traversal`          | **RDF graph → JSON** extraction guided by JSON Schema + traversal-schema prep + typed filters                        |
| `@graviola/sparql-db-impl`               | SPARQL **`Store`** (`initSPARQLStore`) + legacy **`AbstractDatastore`** (`initSPARQLAbstractDatastore`)              |
| `@graviola/prisma-db-impl`               | `AbstractDatastore` over Prisma                                                                                      |
| `@graviola/restfull-fetch-db-impl`       | `AbstractDatastore` over REST                                                                                        |
| `@graviola/simple-local-data-store`      | In-memory `AbstractDatastore` (Zustand-backed; testing/prototyping)                                                  |
| `@graviola/json-schema-prisma-utils`     | JSON Schema → Prisma schema (used by Prisma backends)                                                                |
| `@graviola/json-schema2prisma-schema`    | CLI wrapping the above                                                                                               |
| `@graviola/remote-query-implementations` | Store-specific SPARQL query builders (paginate, count, …)                                                            |
| `@graviola/edb-data-mapping`             | Declarative source → target mapping engine + strategy registry                                                       |
| `@graviola/edb-authorities`              | Search/retrieve metadata from external authorities                                                                   |
| `@graviola/edb-marc-to-rdf`              | MARC21 → RDF (cultural heritage ingestion)                                                                           |
| `@graviola/edb-wikidata-utils`           | Lookup helpers for Wikidata                                                                                          |
| `@graviola/edb-file-import`              | RDF file import (Turtle/N-Quads/JSON-LD via n3, jsonld)                                                              |
| `@graviola/edb-maintenance-utils`        | Document and graph loading utilities for maintenance tasks                                                           |

**Read pipeline (typical):**

```
JSON Schema (or Zod-derived JSON Schema)
    ↓ sparql-schema (normalize, then construct)
SPARQL CONSTRUCT query
    ↓ executed against AbstractDatastore (SPARQL backend)
RDF graph result
    ↓ edb-graph-traversal
Typed JSON object
    ↓ edb-state-hooks (TanStack Query)
React component state
```

Writes invert this: form data is validated against the schema, transformed into RDF triples (or Prisma operations / REST payloads), and committed via the `AbstractDatastore` `upsertDocument` / `removeDocument` / `moveToTrash` methods.

### Layer 3 — State Management & Hooks

| Package                        | Purpose                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `@graviola/edb-state-hooks`    | React hooks for CRUD, forms, search, filters, routing, similarity finder; re-exports TanStack Query |
| `@graviola/data-mapping-hooks` | React hooks wrapping `edb-data-mapping`                                                             |
| `@graviola/edb-debug-utils`    | SPARQL query devtools (logging UI, query inspector)                                                 |

Key hooks in `edb-state-hooks`:

- `useFormData` / `useFormDataStore` — entity load/save lifecycle
- `useFormEditor` — editor state (dirty, validation)
- `useCRUDWithQueryClient` — TanStack Query-integrated CRUD
- `useDataStore` — access the configured `AbstractDatastore`
- `useExtendedSchema` — looks up the current schema for a `typeName` and applies extensions
- `useGlobalCRUDOptions` — `AdbProvider` config context
- `useTypedFilterStore` / `useAnyOfFilterStore` — filter state
- `useGlobalSearch` / `useGlobalSearchWithHelper` — global search state
- `useSimilarityFinderState` — similarity / authority-linking state
- `useModalRegistry`, `useRightDrawerState`, `useFullscreenState`, `useLocalHistory`

### Layer 4 — Store Providers

| Package                                   | Purpose                                                         |
| ----------------------------------------- | --------------------------------------------------------------- |
| `@graviola/sparql-store-provider`         | React provider for a remote SPARQL endpoint                     |
| `@graviola/local-oxigraph-store-provider` | In-browser Oxigraph (WASM, WebWorker) — local-first             |
| `@graviola/rest-store-provider`           | React provider for REST                                         |
| `@graviola/async-oxigraph`                | Async wrapper around Oxigraph WASM (used by the local provider) |

Each provider wires `AdbProvider` (from `edb-state-hooks`) into a concrete `AbstractDatastore`.

### Layer 5 — Form Rendering

| Package                              | Purpose                                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@graviola/semantic-json-form`       | **Top-level form components**: `SemanticJsonForm`, `SemanticJsonFormNoOps`, `GenericForm`, `OptionsModal`, `createSemanticConfig`, `createUISchemata`, `createStubSchema` |
| `@graviola/semantic-jsonform-types`  | TypeScript types shared across form / provider packages                                                                                                                   |
| `@graviola/edb-basic-renderer`       | Standard JSON Forms field renderers (string, number, date, enum, boolean, array, …)                                                                                       |
| `@graviola/edb-linked-data-renderer` | RDF/linked-data-aware renderers (entity pickers, sameAs lookups)                                                                                                          |
| `@graviola/edb-layout-renderer`      | Layout renderers (grids, tabs, sections, vertical, horizontal)                                                                                                            |
| `@graviola/color-picker-renderer`    | Color input renderer                                                                                                                                                      |
| `@graviola/map-libre-gl-renderer`    | MapLibre GL geo renderer                                                                                                                                                  |
| `@graviola/edb-markdown-renderer`    | Markdown editor / preview renderer                                                                                                                                        |
| `@graviola/edb-detail-renderer-core` | **Headless detail-view core** (UISchema tree dispatch, testers, scopes, chips resolution, anyOf/oneOf combinators) — no MUI                                               |
| `@graviola/edb-detail-renderer`      | MUI implementation of the core (`DetailRenderer`, `TopLevelLayout`, control renderers, default chips, `EntitySummaryChip`)                                                |

> **Detail-renderer split (recent):** `DetailUISchema` flat dot-path maps were replaced by JSON Forms `UISchemaElement` trees. Use `generateDefaultDetailUISchema` with `skipScope` / `scopeOverride`. The core package is browser-runtime-agnostic (it depends on JSON Forms core only) and is the recommended attachment point for non-MUI renderers.

### Layer 6 — UI Components

| Package                                          | Purpose                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `@graviola/edb-basic-components`                 | Foundational React components                                                      |
| `@graviola/edb-advanced-components`              | Composite components (`KBMainDatabase`, `EntityDetailModal`, `EditEntityModal`, …) |
| `@graviola/edb-table-components`                 | **`SemanticTable`** — schema-driven data tables (built on `material-react-table`)  |
| `@graviola/edb-virtualized-components`           | Virtualized list components                                                        |
| `@graviola/edb-ui-utils`                         | UI utility functions (incl. `generateDefaultUISchema`)                             |
| `@graviola/entity-finder`                        | Entity search / picker component (multi-knowledge-base)                            |
| `@graviola/edb-default-theme`                    | Default MUI theme (`ThemeComponent`, berry palette, global styles)                 |
| `@graviola/edb-vis-timeline`                     | Timeline view component                                                            |
| `@graviola/edb-sparnatural`                      | Sparnatural visual SPARQL query builder integration                                |
| `@graviola/edb-kxp-components` / `edb-kxp-utils` | Domain-specific components for K10plus library catalog                             |

### Apps & CLI surface

| Package                     | Purpose                                                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@graviola/edb-cli-creator` | Library for assembling CLIs from a JSON Schema (uses `cmd-ts`); base for SLUB-side CLIs                                                                  |
| `apps/testapp`              | Canonical Vite + React example (3 sample schemas, LocalOxigraph)                                                                                         |
| `apps/storybook`            | Storybook 10 with `library-docs/` (sparql-schema, graph-traversal) and `packages/` story sets                                                            |
| `apps/datastore-tests`      | Bun test suite running shared CRUD/query/import suites against every active backend (Oxigraph, Fuseki, Blazegraph, Prisma SQLite/Postgres/MariaDB/Mongo) |
| `apps/json-schema-cli`      | CLI for JSON Schema operations                                                                                                                           |
| `apps/test-prisma-cli`      | Playground CLI for Prisma adapter behavior                                                                                                               |

### Ideas / experimental

| Package                            | Status                      |
| ---------------------------------- | --------------------------- |
| `@graviola/edb-charts`             | Experimental — unstable API |
| `@graviola/edb-resizable-drawer`   | Experimental — unstable API |
| `packages/ideas/type-experiments/` | Internal type experiments   |

---

## Key Concepts

### JSON Schema (or Zod) as the single source of truth

Everything flows from a JSON Schema definition with `@id` and `@type` semantics, enabling round-trip to RDF. Forms, tables, detail views, SPARQL queries, validation, and TypeScript types are all derived. Some apps author Zod and derive JSON Schema from it; the framework supports both shapes.

A small example (from `apps/testapp/src/item-schema.ts`, abridged):

```typescript
export const schema = {
  type: "object",
  definitions: {
    Item: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string", const: "http://example.org/Item" },
        name: { type: "string" },
        category: { $ref: "#/definitions/Category" },
        tags: { type: "array", items: { $ref: "#/definitions/Tag" } },
      },
    },
    Category: {
      type: "object",
      properties: {
        subCategories: {
          type: "array",
          items: { $ref: "#/definitions/Category" },
          "x-inverseOf": {
            inverseOf: ["#/definitions/Category/properties/parentCategory"],
          },
        },
        parentCategory: { $ref: "#/definitions/Category" },
      },
    },
    Tag: {
      /* ... */
    },
  },
};
```

`x-inverseOf` is a JSON Schema extension Graviola understands: it tells the query planner and graph-to-JSON extractor which side of a bidirectional relationship is canonical.

### `SemanticJsonForm` / `GenericForm`

`GenericForm` (in `@graviola/semantic-json-form`) is the highest-level convenience component. Given `entityIRI` and `typeName` it:

1. Looks up the JSON Schema for `typeName` via the `AdbProvider` context.
2. Generates the JSON Forms UI (or uses a configured UI schema).
3. Loads / saves the entity through the configured `AbstractDatastore`.
4. Manages dirty state, validation errors, and focus.

`SemanticJsonForm` is the lower-level form component with explicit schema, UI schema, and data flow control. `SemanticJsonFormNoOps` is the no-CRUD variant used in storybook and embedded contexts.

### `SemanticTable`

Schema-driven table (`material-react-table` under the hood) with:

- Pagination, sorting, filtering against the configured store
- Soft delete (move to trash, restore from trash)
- CSV export
- Row selection, inline editing hooks
- Column visibility configuration

The columns and filters are derived from the same JSON Schema used by the forms.

### `DetailRenderer`

Schema-driven, **read-only** entity views. The detail view is described by a JSON Forms `UISchemaElement` tree — a separate UI schema from the editing UI schema, generated by `generateDefaultDetailUISchema` (with `skipScope` / `scopeOverride`). Layouts include `TopLevelLayout` (header + body), `Group`, `VerticalLayout`, `HorizontalLayout`. Field-level rendering is dispatched by a `Tester` registry: `NamedEntityRenderer`, `ArrayEntityRenderer`, `ArrayPrimitiveRenderer`, `ObjectRenderer`, `DateRenderer`, `EnumRenderer`, `UriRenderer`, `BooleanRenderer`, `NumberRenderer`, etc. Chips (compact representations of an entity) have their own resolution: `EntityChipRenderer`, `EnumChipRenderer`, `MediaChipRenderer`, `PlayableChipRenderer`, `SimpleLabelRenderer`. The headless logic lives in `@graviola/edb-detail-renderer-core`; the MUI bindings are in `@graviola/edb-detail-renderer`.

### Data Mapping Layer

`@graviola/edb-data-mapping` is a declarative source → target transformation engine. Mappings are JSON-LD-flavored documents pairing source paths (JSONPath against the authority response) with target paths in the local schema, optionally invoking a named **strategy**:

```typescript
mapByConfig(sourceData, targetData, mappingConfig, strategyContext);
mapByConfigFlat(sourceData, mappingConfig);
```

Strategy catalog includes `concatenate`, `takeFirst`, `dateStringToSpecialInt`, `createEntity` (with sameAs back-link), template substitution, and recursion into nested mappings. The catalog is extensible. Production users: Wikidata, GND, DBpedia ingestion in cultural heritage applications.

### Store Provider Pattern

Wrap your app with a store provider, which configures an `AbstractDatastore` behind `AdbProvider`:

```tsx
// In-browser Oxigraph (no server needed) — local-first default
<LocalOxigraphStoreProvider
  endpoint={{ endpoint: "urn:worker", provider: "oxigraph", active: true }}
  initialData={turtleString}
  localPersistence={{ enabled: true, restoreOnLoad: true, debounceMS: 5000, storageKey: "..." }}
>
  <App />
</LocalOxigraphStoreProvider>

// Remote SPARQL endpoint
<SparqlStoreProvider endpoint="http://localhost:3030/ds">
  <App />
</SparqlStoreProvider>
```

CRUD hooks then automatically use the configured store. The provider is the only seam where storage choice leaks into application code.

### Typed filter API (Prisma-style with optional Zod inference)

`AbstractDatastore` exposes typed filter operations:

- `filterTypedDocument<T>(typeName, entityIRI, options)` — load a single document with `where` / `include` / `select`
- `filterTypedDocuments<T>(typeName, options)` — search with `where` + pagination + search string
- `getEntitiesWithClassesByFilter<T>(options)` — entity-IRI → type-IRIs map for a filter

Filters are validated at runtime (`filterValidationMode`: `'throw' | 'warn' | 'off'`). When `T = z.infer<typeof zodSchema>`, the filter shape is fully typed end to end. The SPARQL implementation lives in `@graviola/sparql-schema` (`buildTypedSPARQLQuery`) and consumes the same options.

---

## Architectural Trajectory (NOT yet implemented)

The conceptual documentation calls out directions whose architectural shape is clear but whose implementations have not landed. Treat the following as **not present in the codebase today** unless told otherwise:

- **Schema evolution via lenses** — bidirectional version migrations (`gra:version` per entity, lens chains composed at query time). The closest existing system is [Project Cambria](https://www.inkandswitch.com/cambria/).
- **Calculated fields** — the Layer 2 stack is implemented (`formula-dependency`, `formula-runtime`, `calc-engine`, `formula-materialization`; see below). Still trajectory-only: true delta computation (differential dataflow-style), query-scoped (level 4) aggregates, and native aggregate pushdown.
- **Signed states / authoritative value** — cryptographically signed entity snapshots (W3C Verifiable Credentials), with a computed authoritative value over multiple signatures.
- **Schema-as-data and lens-as-data** — schemas and lenses as JSON-LD documents flowing through the same federated sync transport (Yjs, Solid).

Current development decisions should remain _compatible_ with these directions but should not pretend they are implemented. See [Architectural trajectory](https://gravio-la.github.io/graviola-concept-documentation/trajectory.html) and the [Graviola Glossary](https://gravio-la.github.io/graviola-concept-documentation/glossary.html) for vocabulary.

---

## Development Conventions

### Reuse before reinvent (quality bar for agents)

These are hard rules, not preferences. Recent calc-engine work regressed on all of them; do not repeat.

1. **Prefer `lodash-es` over hand-rolled helpers.** The monorepo already depends on `lodash-es` via `catalog:`. Before writing `getAtPath`, `cloneData`, `uniq` via `Set`, deep merge, debounce, etc., import the lodash equivalent (`get`, `cloneDeep`, `uniq`, `merge`, `debounce`, …) with a **per-function import** (`import get from "lodash-es/get"`) and add `"lodash-es": "catalog:"` to the package if missing. Do not reimplement path walks, deep clones, or collection utilities locally.

2. **Prefer Layer 1 helpers over local copies.** Before parsing JSON Pointers, `$ref`s, definition names, CBD boundaries, IRI encoding, or schema identity, search `@graviola/json-schema-utils`, `@graviola/edb-core-utils`, `@graviola/typed-query-types`, and related Layer 1 packages. Examples that must not be reinvented:
   - `definitionNameFromScope` / `definitionScope` / `definitionNameFromRef` / `definitionPropertyScope` — `$defs`/`definitions`-aware scope helpers
   - `defs`, `bringDefinitionToTop`, `cbdBoundaryScopes`, `stripXCalcProperties`
   - `selectionDepth` / `resolveEffectiveMaxRecursion` in `@graviola/typed-query-types`
     If a helper is missing, **add it to the Layer 1 package and call it from callers** — do not paste a one-off regex into Layer 2+.

3. **No domain leakage into library code.** Demo/fixture heuristics (e.g. garden-fee structural type guessing, hardcoded type names like `"Garden"`) must never land in `@graviola/*` library packages. Entity typing uses `@type` (and schema scopes), not shape sniffing. Golden fixtures shared across packages belong in a **private fixture package** (e.g. `@graviola/calc-fixtures`) consumed as a **devDependency** — never export fixtures from a public library barrel.

4. **Search the monorepo before inventing.** Grep for an existing helper or the lodash usage pattern in sibling packages (`data-mapping`, `json-schema-utils`, `sparql-schema`, …) and match that style.

### File Organization

```
packages/<name>/
├── src/
│   ├── index.ts             # Public exports (barrel file)
│   ├── ComponentName.tsx    # Component implementation
│   ├── ComponentName.test.ts# Co-located tests
│   └── types.ts             # TypeScript type definitions
├── dist/                    # tsup output (gitignored)
├── package.json
├── tsconfig.json            # Extends @graviola/edb-tsconfig
└── tsup.config.ts           # Or implicit via @graviola/edb-tsup-config
```

### TypeScript

- Strict mode is **on** everywhere
- Target: **ES2022**, module resolution: **node** / **bundler**
- All packages export both **CJS** (`dist/index.cjs`) and **ESM** (`dist/index.js`)
- Declaration files: `dist/index.d.ts`
- `tsconfig` bases (`@graviola/edb-tsconfig`):
  - `base.json` — node / library packages
  - `react-library.json` — React component packages
  - `vite.json` — Vite apps
  - `nextjs.json` — Next.js apps

### Testing

> **In transition: the project is migrating from Jest to `bun test`.** New tests should use `bun:test`. Already migrated: `sparql-schema`. Many other packages still use Jest with `ts-jest`; some via `NODE_OPTIONS=--experimental-vm-modules`. Jest will be removed once migrations finish.

- **`bun test`** (preferred going forward) — built-in, no extra configuration
  - Import from `"bun:test"` instead of `"@jest/globals"` or globals
- **Jest** with `ts-jest` — still present in `data-mapping`, `state-hooks`, `core-utils`, `json-schema-utils`, `marc-to-rdf`, `file-import`, `maintenance-utils`, `authorities`
- Test files: `*.test.ts` / `*.test.tsx` co-located with source
- **`apps/datastore-tests`** is the **contract test suite for `AbstractDatastore` implementations**. Each backend (Oxigraph in-process, SPARQL HTTP against Oxigraph/Fuseki/Blazegraph, Prisma SQLite/PostgreSQL/MariaDB/MongoDB) runs the same shared suites under `src/suites/`. Backend selection is by environment variables (see `apps/datastore-tests/README.md`).
- **Storybook tests** run via Vitest 4 + `@vitest/browser` + Playwright. The storybook command lives in `apps/storybook/package.json` (`bun run test` inside that app).

### Linting & Formatting

- ESLint config from `eslint-config-edb` (unscoped legacy name; in `packages/eslint-config-edb/`)
- Prettier for formatting; runs via `lint-staged` on commit
- Git hooks via Husky (`bun run prepare`)

### Adding a new package

1. Use `_templates/edb/` Hygen templates where applicable (`frontend-package`, `frontend-package-raw`, `manifestation`, `renderer-package`, `tsup-package`).
2. Follow the `src/index.ts` barrel export pattern.
3. Add to the appropriate workspace pattern in root `package.json` `workspaces.packages`.
4. Use `workspace:*` for internal deps and `catalog:` for shared external deps.
5. Extend the correct `@graviola/edb-tsconfig` base.
6. Configure `tsup` for dual CJS / ESM output (or rely on `@graviola/edb-tsup-config`).
7. Add to Turborepo pipeline if the task isn't already covered by `tasks.*` in `turbo.json`.

### Storybook conventions

`apps/storybook/.storybook/preview.tsx` registers **only infrastructure** decorators globally (theme, query client, MUI date locale, NiceModal, CssBaseline). **Storage providers must be declared explicitly per story** via decorators in `.storybook/decorators/`:

- `withLocalOxigraph` — wraps a story in `LocalOxigraphStoreProvider`
- `withSparqlEndpoint` — wraps in `SparqlStoreProvider`
- `withGraviolaProvider` — wraps in a configured `AdbProvider` for stories that need `useAdbContext`

This makes the storage contract visible at the story level. Stories under `library-docs/` document non-component subsystems (`sparql-schema`, `graph-traversal`) with MDX (mermaid via `mdx-mermaid`).

---

## RDF / Semantic Web Stack

| Library                      | Role                                           |
| ---------------------------- | ---------------------------------------------- |
| `@rdfjs/data-model`          | RDF term creation                              |
| `@rdfjs/types`               | TypeScript types for RDF                       |
| `@rdfjs/namespace`           | IRI namespace helpers                          |
| `@rdfjs/dataset`             | RDF dataset implementation                     |
| `n3`                         | Turtle / N-Triples / TriG / N-Quads parsing    |
| `jsonld`                     | JSON-LD processing                             |
| `jsonld-context-parser`      | JSON-LD context parsing                        |
| `clownface`                  | Graph traversal API                            |
| `oxigraph`                   | In-browser SPARQL engine (WASM, WebWorker)     |
| `@tpluscode/sparql-builder`  | Type-safe SPARQL query construction            |
| `@tpluscode/rdf-string`      | SPARQL/Turtle template literals (escape-safe)  |
| `@tpluscode/rdf-ns-builders` | Pre-built RDF namespaces (rdf, rdfs, owl, …)   |
| `ajv` / `ajv-formats`        | JSON Schema validation                         |
| `json-schema-to-ts`          | JSON Schema → TS type inference (in renderers) |
| `zod`                        | Optional Zod authoring; derive JSON Schema     |

### SPARQL flavours

`@graviola/sparql-schema` supports multiple SPARQL dialects (selectable per deployment via `flavour`):

- `default` (standard SPARQL 1.1)
- `oxigraph` (uses `BIND` for single-subject optimizations)
- `blazegraph`
- `allegro`

---

## Environment & Infrastructure

### Environment variables

Key env vars (see `.env`, `turbo.json` `globalDependencies`, and `apps/datastore-tests/README.md`):

- `DATABASE_PROVIDER` — `sqlite` | `postgresql` | `mongodb` | … (Prisma; rewritten into the `prisma/*.prisma` schemas at build time)
- `OXIGRAPH_URL`, `FUSEKI_URL`, `BLAZEGRAPH_URL` — SPARQL endpoint URLs for `apps/datastore-tests`
- `SQLITE_URL`, `POSTGRES_URL`, `MARIADB_URL`, `MONGODB_URL` — Prisma URLs for `apps/datastore-tests`
- `SKIP_DEFAULT_ADAPTER`, `SKIP_PRISMA` — control which adapters run in `apps/datastore-tests`

### Docker

`apps/datastore-tests/docker-compose.yml` provides local SPARQL endpoints (Oxigraph, Fuseki, Blazegraph, Virtuoso) and SQL/Mongo databases for the contract tests. Bring services up with `bun run docker:up` from inside that app directory.

### Nix

`flake.nix` provides two reproducible dev shells:

- `nix develop` (default) — Prisma 7 engines (use with `catalogs.prisma` set to 7.x)
- `nix develop .#prisma6` — Prisma 6 engines (use with `catalogs.prisma` set to 6.x; required for MongoDB tests)

The shell exposes `catalogToPrisma <version>` to keep `package.json` `workspaces.catalogs.prisma.{prisma,@prisma/client}` aligned with the shell. After switching the catalog, run `bun install` from the repo root.

The shell also exposes a `pages-preview` alias (calls `./preview-pages.sh`) for previewing the combined Pages output (`_site/`) locally.

---

## What NOT to focus on

- **Domain-specific SLUB applications and schemas.** Maintained in a separate repository; not part of this core monorepo.
- **`packages/ideas/`.** Experimental / incubating; APIs are unstable.
- **`packages/indexeddb-store-provider/`, `packages/indexeddb-dataset/`, `apps/edb-api/`, `apps/edb-cli/`.** Empty / inactive directories at present.
- **Trajectory features still incomplete (lenses, signed states, query-scoped aggregates).** See [conceptual docs trajectory chapter](https://gravio-la.github.io/graviola-concept-documentation/trajectory.html). Calculated fields have a working Layer 2 stack (`formula-dependency`, `formula-runtime`, `calc-engine`, `calc-fixtures`) — do not reintroduce domain demos into those packages.

The **canonical reference implementation** is `apps/testapp` — a small Vite + React app with three example schemas (`item-schema`, `metal-schema`, `course-schema`) demonstrating `GenericForm`, `SemanticTable`, `DetailRenderer`, and `LocalOxigraphStoreProvider`.

---

## Key files for understanding the framework

| File                                                                    | Why                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| `apps/testapp/src/main.tsx`                                             | Top-level wiring (router, theme, Snackbar, GraviolaProvider) |
| `apps/testapp/src/provider/GraviolaProvider.tsx`                        | Canonical `AdbProvider` + `LocalOxigraphStoreProvider` setup |
| `apps/testapp/src/item-schema.ts`                                       | Example JSON Schema with `$ref` nesting and `x-inverseOf`    |
| `packages/global-types/src/index.ts`                                    | **`AbstractDatastore` interface** + typed filter contracts   |
| `packages/semantic-json-form/src/SemanticJsonForm.tsx`                  | Core form component                                          |
| `packages/semantic-json-form/src/GenericForm.tsx`                       | Top-level convenience component                              |
| `packages/sparql-schema/src/crud/`                                      | CRUD → SPARQL translation                                    |
| `packages/sparql-schema/src/schema2sparql/traversalSchema2construct.ts` | The heart of JSON Schema → CONSTRUCT generation              |
| `packages/sparql-schema/src/schema2sparql/buildTypedSPARQLQuery.ts`     | Type-safe query API (Zod-aware)                              |
| `packages/graph-traversal/src/traverseGraphExtractBySchema.ts`          | RDF graph → JSON extraction                                  |
| `packages/graph-traversal/src/typed-filters.ts`                         | Runtime filter validation (Ajv-based)                        |
| `packages/state-hooks/src/useCRUDWithQueryClient.ts`                    | React Query CRUD integration                                 |
| `packages/table-components/src/SemanticTable.tsx`                       | Schema-driven table                                          |
| `packages/detail-renderer-core/src/index.ts`                            | Headless detail-view dispatch (testers, scopes, chips)       |
| `packages/detail-renderer/src/DetailRenderer.tsx`                       | MUI implementation built on the core                         |
| `packages/data-mapping/src/index.ts`                                    | Mapping engine + strategy catalog                            |
| `apps/datastore-tests/src/datastore.test.ts`                            | Contract test entry point — adapters × shared suites         |
| `flake.nix`                                                             | Dev-shell definition (Prisma 6 / 7 variants)                 |
