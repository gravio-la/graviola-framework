# Graviola

A TypeScript framework for building schema-driven applications that manage structured data through forms, tables, and queries — across a range of storage backends.

## What it is

Graviola takes a **JSON Schema** definition as its central artifact and derives from it, at runtime: forms for creating and editing entities, tables for browsing them, queries against the configured storage backend, and validation of the data flowing in and out. The same schema drives the user interface, the persistence layer, and the integration layer.

The framework is **storage-agnostic**. The same schemas, forms, and tables operate against:

- an in-browser [Oxigraph](https://github.com/oxigraph/oxigraph) SPARQL store (WebAssembly, no server required),
- a remote SPARQL 1.1 endpoint (Fuseki, Virtuoso, Blazegraph, GraphDB, …),
- a [Prisma](https://www.prisma.io/)-backed relational database (PostgreSQL, SQLite, …),
- a REST API,
- or an in-memory store for testing and prototyping.

It also includes a **declarative mapping layer** for ingesting records from external authority sources — Wikidata, the German Integrated Authority File (GND), DBpedia — into the application's local data model.

For conceptual background, motivation, and architecture detail, see the **[Graviola conceptual documentation](https://github.com/gravio-la/graviola-conceptual-documentation)** book.

## What it is not

- Not a database — it is a layer over storage backends you choose and operate.
- Not a CMS — no built-in role model, publication workflow, or asset pipeline.
- Not a complete frontend stack — page routing, application shell, and authentication are application concerns.
- Not a reasoner — inference, where needed, is the store's or the application's responsibility.

## Quick start

Requires [Bun](https://bun.sh/) (see `packageManager` field in `package.json` for the pinned version).

```bash
bun install
bun run build:packages
bun run dev:testapp
```

Open the URL printed by Vite (typically `http://localhost:5173`).

The entry point for the example is `apps/testapp` — a minimal Vite + React application demonstrating `GenericForm` over a small schema with nested entities. It exercises the full CRUD path end-to-end.

### Launching a local SPARQL endpoint

The testapp works with an in-memory store by default. To connect to a SPARQL endpoint locally:

```bash
docker run -p 7878:7878 -v $(pwd)/data:/data -it ghcr.io/oxigraph/oxigraph:latest
```

Configure the endpoint URL in the app's settings modal, or set it via environment variable at build time.

## Development commands

| Command | Purpose |
|---|---|
| `bun run build` | Build all packages and apps |
| `bun run build:packages` | Build library packages only |
| `bun run dev:testapp` | Run the testapp in watch mode |
| `bun run dev:storybook` | Run the component Storybook |
| `bun run dev:packages` | Watch-build all library packages |
| `bun run test` | Run all tests |
| `bun run lint` | Lint the entire monorepo |
| `bun run lint:fix` | Lint and auto-fix |
| `bun run format` | Format all source files with Prettier |

### Committing

Formatting is enforced on commit via Husky and lint-staged. To install the hooks:

```bash
bun run prepare
```

### Testing

Core packages use `bun test`. The project is migrating away from Jest; new tests should use `import { ... } from "bun:test"`.

## Repository layout

```
graviola-framework/
├── packages/          # ~50 publishable library packages (@graviola/*)
│   ├── form-renderer/ # JSON Forms renderer sub-workspace
│   └── ...
├── apps/
│   ├── testapp/       # Canonical example (Vite + React)
│   └── storybook/     # Component playground
├── prisma/            # Prisma schema files
└── docker/            # Docker Compose services
```

All packages are scoped under `@graviola/` and are designed to be consumed individually. Internal dependencies use `workspace:*`; shared external versions use Bun's `catalog:` protocol.

## Documentation

- **[Graviola conceptual documentation](https://gravio-la.github.io/graviola-concept-documentation/)** — architecture, design rationale, capabilities, and the framework's conceptual trajectory. Start here if you want to understand *why* decisions were made the way they were.
- **Storybook** (`bun run dev:storybook`) — interactive examples for individual components.
- **`apps/testapp`** — the simplest complete usage example in the codebase.

## Security note

The SPARQL layer was designed for open or institutional knowledge bases. It has not been hardened for production deployments handling sensitive data. If you are exposing the framework to untrusted input, implement access controls and query validation at the infrastructure level.

## License

Copyright © 2022–2025 Sebastian Tilsch  
Copyright © 2024 SLUB Dresden

Licensed under the [GNU General Public License v3.0](LICENSE).
