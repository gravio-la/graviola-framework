# CLAUDE.md — Graviola CRUD Framework

## Project Purpose

Graviola is a **semantic CRUD framework** providing:

1. **A flexible semantic layer for CRUD operations** — driven by JSON Schema definitions, transparently backed by SPARQL/RDF, Prisma (relational), or REST stores.
2. **Convention-before-configuration form UI** — JSON Forms-based forms that are auto-generated from schema with minimal configuration.
3. **Schema-driven semantic tables** — The `SemanticTable` component renders filterable, sortable, paginated tables derived directly from JSON Schema.
4. **An optional mapping/normalization layer** — Declarative field mapping from external authority sources (Wikidata, GND, DBpedia) into local schemas.

The framework is **technology-agnostic at the storage layer** — the same JSON Schema-driven forms and tables work against an in-browser SPARQL store (Oxigraph), a remote SPARQL endpoint, a Prisma/SQLite DB, or a REST API.

---

## Repository Structure

```
graviola-crud-framework/
├── packages/              # All publishable library packages (~50 packages)
│   ├── form-renderer/     # JSON Forms renderer packages (sub-workspace)
│   ├── ideas/             # Experimental / incubating packages (sub-workspace)
│   └── ...                # Core packages (see below)
├── apps/                  # Applications
│   ├── testapp/           # ← PRIMARY example app (Vite + React)
│   ├── storybook/         # Component playground
│   └── ...                # Other CLI/API apps (see repo)
├── _templates/            # Code generation templates (hygen)
├── prisma/                # Prisma schema files
├── docker/                # Docker Compose services
└── .changeset/            # Changeset versioning
```

> **Note**: Domain-specific SLUB apps and schemas live in a separate repository (`split/manifestations` branch elsewhere). The canonical example in this repo is `apps/testapp`.

---

## Monorepo Tooling

| Tool                 | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| **Bun** (v1.3.10+)   | Package manager and runtime                       |
| **Turborepo**        | Build orchestration and caching                   |
| **tsup**             | Per-package TypeScript bundler (CJS + ESM output) |
| **TypeScript** v5.8+ | Strict mode, target ES2022                        |
| **Changesets**       | Version management and changelog generation       |

### Common Commands

```bash
# Install dependencies
bun install

# Build all packages (respects dependency order via turbo)
bun run build

# Build only library packages (fastest for dev)
bun run build:packages

# Run the testapp (primary example)
cd apps/testapp && bun run dev

# Run all packages in watch mode
bun run dev:packages

# Run tests
bun run test

# Run linting
bun run lint
bun run lint:fix

# Format code
bun run format

# Add a changeset before publishing
bun run changeset

# Release (requires build first)
bun run release
```

---

## Package Naming Conventions

All packages are scoped under `@graviola/`:

- `@graviola/edb-*` — Core framework packages (edb = "entity database")
- `@graviola/edb-*-renderer` — JSON Forms renderer packages (under `packages/form-renderer/`)
- `@graviola/semantic-*` — High-level semantic UI packages
- `@graviola/sparql-*` — SPARQL query/store packages
- `@graviola/json-schema-*` — JSON Schema utility packages
- `@graviola/*-db-impl` — Database implementation adapters

### Internal workspace dependencies use `workspace:*`:

```json
"@graviola/edb-core-types": "workspace:*"
```

### Shared dependency versions use the catalog:

```json
"react": "catalog:",
"@mui/material": "catalog:",
"@jsonforms/core": "catalog:jsonforms"
```

---

## Core Package Architecture

### Layer 1 — Foundation (no framework deps)

| Package                       | Purpose                                                  |
| ----------------------------- | -------------------------------------------------------- |
| `@graviola/edb-core-types`    | TypeScript definitions, RDF/SPARQL types                 |
| `@graviola/edb-core-utils`    | IRI encoding, utility functions                          |
| `@graviola/edb-global-types`  | Global interface definitions                             |
| `@graviola/json-schema-utils` | JSON Schema manipulation (resolve `$ref`, flatten, etc.) |
| `@graviola/jsonld-utils`      | JSON-LD ↔ RDF conversion utilities                       |

> **Critical constraint**: Layer 1 and Layer 2 packages (below) **must never take on React, MUI, or any browser/frontend dependencies**. They are consumed by CLIs and server-side apps (for example `@graviola/edb-cli-creator`) via Bun. Introducing frontend deps into these packages would break non-browser consumers.

### Layer 2 — Schema → Query Translation

| Package                            | Purpose                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| `@graviola/sparql-schema`          | **JSON Schema → SPARQL queries** (CONSTRUCT, SELECT, filters) |
| `@graviola/graph-traversal`        | **RDF graph → JSON** extraction guided by JSON Schema         |
| `@graviola/sparql-db-impl`         | SPARQL CRUD operations (save/load/remove/trash)               |
| `@graviola/prisma-db-impl`         | Prisma ORM CRUD operations                                    |
| `@graviola/restfull-fetch-db-impl` | REST/fetch-based CRUD operations                              |

**The semantic CRUD pipeline:**

```
JSON Schema definition
    ↓ sparql-schema
SPARQL CONSTRUCT query
    ↓ executed against store
RDF Graph result
    ↓ graph-traversal
Typed JSON object
    ↓ state-hooks / React Query
React component state
```

### Layer 3 — State Management

| Package                            | Purpose                                               |
| ---------------------------------- | ----------------------------------------------------- |
| `@graviola/edb-state-hooks`        | React hooks for CRUD, forms, search, filters, routing |
| `@graviola/edb-data-mapping`       | Declarative field mapping/transformation              |
| `@graviola/edb-data-mapping-hooks` | React hooks wrapping data-mapping                     |

Key hooks in `edb-state-hooks`:

- `useFormData` — manages entity load/save lifecycle
- `useFormEditor` — editor state (dirty, validation)
- `useCRUDWithQueryClient` — TanStack Query-integrated CRUD
- `useDataStore` — access to the configured store provider
- `useGlobalCRUDOptions` — global CRUD config context
- `useTypedFilterStore` / `useAnyOfFilterStore` — filter state
- `useGlobalSearch` — global search state
- `useSimilarityFinderState` — similarity/authority linking state

### Layer 4 — Store Providers

| Package                                   | Purpose                                       |
| ----------------------------------------- | --------------------------------------------- |
| `@graviola/sparql-store-provider`         | SPARQL endpoint React context provider        |
| `@graviola/local-oxigraph-store-provider` | In-browser Oxigraph (WebWorker) provider      |
| `@graviola/rest-store-provider`           | REST API provider                             |
| `@graviola/simple-local-data-store`       | In-memory Zustand store (testing/prototyping) |

### Layer 5 — Form Rendering

| Package                               | Purpose                                                          |
| ------------------------------------- | ---------------------------------------------------------------- |
| `@graviola/semantic-json-form`        | **Top-level form component** (`SemanticJsonForm`, `GenericForm`) |
| `@graviola/semantic-jsonform-types`   | TypeScript types for form props                                  |
| `@graviola/edb-basic-renderer`        | Standard JSON Forms field renderers                              |
| `@graviola/edb-linked-data-renderer`  | RDF/linked-data-aware renderers (entity pickers, etc.)           |
| `@graviola/edb-layout-renderer`       | Layout renderers (grids, tabs, sections)                         |
| `@graviola/edb-color-picker-renderer` | Color input renderer                                             |
| `@graviola/edb-map-libre-gl-renderer` | Map/geo renderer (MapLibre GL)                                   |
| `@graviola/edb-markdown-renderer`     | Markdown editor/preview renderer                                 |

### Layer 6 — UI Components

| Package                                | Purpose                                         |
| -------------------------------------- | ----------------------------------------------- |
| `@graviola/edb-basic-components`       | Foundational React components                   |
| `@graviola/edb-advanced-components`    | Complex composite components                    |
| `@graviola/edb-table-components`       | **`SemanticTable`** — schema-driven data tables |
| `@graviola/edb-virtualized-components` | Virtualized list components                     |
| `@graviola/edb-ui-utils`               | UI utility functions                            |
| `@graviola/entity-finder`              | Entity search/picker component                  |

---

## Key Concepts

### JSON Schema as the Single Source of Truth

Everything flows from a JSON Schema definition:

- Forms are generated automatically from the schema (with optional UI schema overrides)
- SPARQL queries are generated from the schema
- Table columns can be derived from the schema
- Validation uses the same schema (via `ajv`)

Example schema usage (from `apps/testapp`):

```typescript
// Define schema with $refs for nested entities
export const schema = {
  type: "object",
  definitions: {
    Item: {
      type: "object",
      properties: {
        name: { type: "string" },
        category: { $ref: "#/definitions/Category" },
        tags: { type: "array", items: { $ref: "#/definitions/Tag" } }
      }
    },
    Category: { /* ... */ },
    Tag: { /* ... */ }
  }
};

// Use GenericForm — auto-generates form + handles CRUD
<GenericForm
  entityIRI={itemUrl}
  typeName="Item"
  onFormDataChange={setFormData}
/>
```

### SemanticJsonForm / GenericForm

`GenericForm` is the highest-level convenience component. It:

1. Looks up the JSON Schema for the given `typeName`
2. Generates a JSON Forms UI
3. Loads/saves the entity via the configured store provider
4. Handles dirty state, validation, and error display

`SemanticJsonForm` is the lower-level version with explicit schema/uiSchema props.

### SemanticTable

Schema-driven table with built-in:

- SPARQL-backed pagination, sorting, filtering
- Soft delete (move to trash / restore)
- CSV export
- Row selection, inline editing support
- Column visibility configuration

Uses `material-react-table` under the hood.

### Data Mapping Layer

`@graviola/edb-data-mapping` provides declarative transformations between formats:

```typescript
// Map external authority data (e.g., Wikidata) into local schema shape
mapByConfig(sourceData, mappingConfig);
mapByConfigFlat(sourceData, mappingConfig);
```

Supports:

- JSONPath field extraction
- Dot-notation template strings
- Strategy-based field mapping (first match, concat, etc.)
- Integration with `sameAsTypeMap` for entity equivalence across authorities

### Store Provider Pattern

The framework is store-agnostic. Wrap your app with a store provider:

```tsx
// SPARQL endpoint
<SparqlStoreProvider endpoint="http://localhost:3030/ds">
  <App />
</SparqlStoreProvider>

// In-browser Oxigraph (no server needed)
<LocalOxigraphStoreProvider>
  <App />
</LocalOxigraphStoreProvider>
```

All CRUD hooks then automatically use the configured store.

---

## Development Conventions

### File Organization

```
packages/<name>/
├── src/
│   ├── index.ts          # All public exports (barrel file)
│   ├── ComponentName.tsx # Component implementation
│   ├── ComponentName.test.ts  # Co-located tests
│   └── types.ts          # TypeScript type definitions
├── dist/                 # Built output (gitignored, generated by tsup)
├── package.json
├── tsconfig.json         # Extends from packages/tsconfig/
└── tsup.config.ts        # Build config
```

### TypeScript

- Strict mode is **on** everywhere
- Target: **ES2022**, module resolution: **node**
- All packages export both **CJS** (`dist/index.cjs`) and **ESM** (`dist/index.js`)
- Declaration files: `dist/index.d.ts`
- Use `tsconfig` base from `packages/tsconfig/`:
  - `base.json` — node/library packages
  - `react-library.json` — React component packages
  - `vite.json` — Vite apps
  - `nextjs.json` — Next.js apps

### Testing

> **In transition**: The project is **migrating from Jest to `bun test`**. New tests should be written using `bun:test`. `sparql-schema` is already using it. Jest will be removed once all packages are migrated.

- **`bun test`** (preferred going forward) — built-in, no extra configuration needed
  - Import from `"bun:test"` instead of `"@jest/globals"` or globals
  - No `NODE_OPTIONS=--experimental-vm-modules` needed
- **Jest** with `ts-jest` — still present in many packages, being phased out
- Test files: `*.test.ts` / `*.test.tsx` co-located with source
- Packages with tests: `core-utils`, `json-schema-utils`, `data-mapping`, `sparql-schema`, `graph-traversal`
- **Cypress** for E2E tests in some apps (not the primary focus for core libraries)

### Linting & Formatting

- ESLint config from `@graviola/eslint-config-edb`
- Prettier for formatting (runs via lint-staged on commit)
- Git hooks via Husky

### Adding a New Package

1. Use `_templates/` hygen templates if available
2. Follow the standard `src/index.ts` barrel export pattern
3. Add to the appropriate workspace in root `package.json` workspaces
4. Use `workspace:*` for internal deps and `catalog:` for shared external deps
5. Extend the correct tsconfig base
6. Configure `tsup` for dual CJS/ESM output
7. Add to Turborepo pipeline if needed

---

## RDF / Semantic Web Stack

The framework uses the RDFJS ecosystem:

| Library                     | Role                                 |
| --------------------------- | ------------------------------------ |
| `@rdfjs/data-model`         | RDF term creation                    |
| `@rdfjs/types`              | TypeScript types for RDF             |
| `@rdfjs/namespace`          | IRI namespace helpers                |
| `n3`                        | Turtle/N-Triples/TriG parsing        |
| `jsonld`                    | JSON-LD processing                   |
| `clownface`                 | Graph traversal API                  |
| `oxigraph`                  | In-browser SPARQL engine (WebWorker) |
| `@tpluscode/sparql-builder` | Type-safe SPARQL query construction  |

### SPARQL Flavours

The `sparql-schema` package supports multiple SPARQL dialects:

- `default` (standard SPARQL 1.1)
- `oxigraph`
- `blazegraph`
- `allegro`

---

## Environment & Infrastructure

### Environment Variables

Key env vars (see `.env` and `turbo.json` `globalDependencies`):

- `DATABASE_PROVIDER` — `sqlite` | `postgresql` | etc. (for Prisma)
- SPARQL endpoint URLs (app-specific)

### Docker

`docker-compose.yml` provides local services (SPARQL endpoints, etc.) for development.

### Nix

`flake.nix` provides a reproducible development environment with Nix.

---

## What NOT to Focus On

- **Domain-specific SLUB apps** — Maintained in a separate repository; not part of this core monorepo branch.
- **`packages/ideas/`** — Experimental/incubating packages; unstable API.

The **canonical reference implementation** is `apps/testapp` — a minimal Vite+React app demonstrating `GenericForm` and core framework usage.

---

## Key Files for Understanding the Framework

| File                                                   | Why                                     |
| ------------------------------------------------------ | --------------------------------------- |
| `apps/testapp/src/App.tsx`                             | Minimal complete usage example          |
| `apps/testapp/src/schema.ts`                           | Example JSON Schema with `$ref` nesting |
| `packages/semantic-json-form/src/SemanticJsonForm.tsx` | Core form component                     |
| `packages/semantic-json-form/src/GenericForm.tsx`      | Top-level convenience component         |
| `packages/sparql-schema/src/crud.ts`                   | CRUD → SPARQL translation               |
| `packages/sparql-schema/src/schema2sparql.ts`          | JSON Schema → SPARQL CONSTRUCT          |
| `packages/graph-traversal/src/index.ts`                | RDF graph → JSON extraction             |
| `packages/state-hooks/src/useCRUDWithQueryClient.ts`   | React Query CRUD integration            |
| `packages/table-components/src/SemanticTable.tsx`      | Schema-driven table                     |
| `packages/data-mapping/src/index.ts`                   | Mapping/transformation layer            |
