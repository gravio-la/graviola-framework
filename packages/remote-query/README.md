# @graviola/remote-query-implementations

HTTP access to concrete SPARQL endpoints as `CRUDFunctions` for `@graviola/sparql-db-impl`.

![Layer: 2 (Schema → Query)](https://img.shields.io/badge/Layer-2%20Schema%20to%20Query-blue)
![Environment: Universal](https://img.shields.io/badge/Environment-Browser%20%2B%20Bun%20%2B%20Node-green)

## Why this package exists

Graviola's SPARQL store backend (`@graviola/sparql-db-impl`) does not talk to endpoints directly. It expects a **`CRUDFunctions`** bundle — `askFetch`, `constructFetch`, `selectFetch`, and `updateFetch` — that performs HTTP against a query/update URL. This package supplies those fetch implementations for Oxigraph, AllegroGraph, QLever, and generic SPARQL 1.1 HTTP endpoints, including optional basic or token authentication.

## Position in the framework

The package is in **Layer 2 (Schema → Query)** alongside `@graviola/sparql-schema`. It has no React. It depends on `@graviola/edb-core-types`, `@graviola/edb-core-utils`, `@rdfjs/dataset`, and `n3`. It runs unchanged in the browser, in Bun, and in Node.

| Role        | Packages                                                                             |
| ----------- | ------------------------------------------------------------------------------------ |
| Consumers   | `sparql-db-impl`, `sparql-store-provider`, `store-factory`, datastore contract tests |
| Complements | `@graviola/sparql-schema` (generates the SPARQL strings these functions POST)        |

## Key concepts

- **Presets.** `oxigraphCrudOptions`, `allegroCrudOptions`, and `qleverCrudOptions` are tiny wrappers around `createSparqlEndpointCrud` or `createHttpSparqlCrudFunctions`. They differ in the CONSTRUCT `Accept` header and in how the response body becomes N-Triples (plain text for Allegro/Oxigraph; QLever JSON rows for QLever).
- **Generic HTTP CRUD.** `createHttpSparqlCrudFunctions` targets SPARQL 1.1 endpoints with separate query and update URLs, Turtle or N-Triples CONSTRUCT, and optional `default-graph-uri` query parameters.
- **Flavour and dialect.** `getSPARQLFlavour` maps an endpoint `provider` to a SPARQL engine profile id (`oxigraph`, `jena`, `blazegraph`, …). `getSparqlDialect` resolves that to feature flags via `resolveSparqlFeatures` from `@graviola/edb-core-utils` — use that import for feature resolution, not a re-export from this package.
- **Auth.** Presets and `createHttpSparqlCrudFunctions` accept an optional `auth` object with `username`/`password` (Basic) or `token` (Bearer-style `Authorization` value).

## Installation

```bash
bun add @graviola/remote-query-implementations
# or
npm install @graviola/remote-query-implementations
```

## Usage

```ts
import { oxigraphCrudOptions } from "@graviola/remote-query-implementations";
import { initSPARQLStore } from "@graviola/sparql-db-impl";

const crud = oxigraphCrudOptions({
  endpoint: "http://localhost:7878/sparql/query",
  active: true,
  provider: "oxigraph",
  auth: { username: "admin", password: "secret" },
});

const store = initSPARQLStore({
  endpoint: {
    endpoint: "http://localhost:7878/sparql/query",
    active: true,
    provider: "oxigraph",
  },
  crudFunctions: crud,
  schema: mySchema,
  defaultPrefix: "http://example.org/",
});
```

## API reference

The full list of exports is in the generated TypeDoc API documentation (`bun run docs` at the repository root). Every public export has a doc comment in `src/`.

## License

MIT
