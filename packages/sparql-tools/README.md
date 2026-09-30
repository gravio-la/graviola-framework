# @graviola/sparql-tools

Endpoint URL conventions and Graph Store Protocol dump/load/clear helpers for CLIs, seeding, and tests.

![Layer: 2 (Schema → Query)](https://img.shields.io/badge/Layer-2%20Schema%20to%20Query-blue)
![Environment: Universal](https://img.shields.io/badge/Environment-Browser%20%2B%20Bun%20%2B%20Node-green)

## Why this package exists

SPARQL deployments disagree on where query, update, and graph-store URLs live relative to a service base. This package normalizes those conventions and exposes small HTTP operations — dump N-Quads via GSP (with CONSTRUCT fallback), load N-Quads, and clear a default or named graph — so CLIs, seed scripts, and integration tests do not reimplement URL stitching and fetch boilerplate.

## Position in the framework

The package is in **Layer 2 (Schema → Query)** alongside `@graviola/sparql-schema` and `@graviola/remote-query-implementations`. It has no React. It depends only on `@graviola/edb-core-utils` (IRI validation for graph names in UPDATE). It runs unchanged in the browser, in Bun, and in Node.

| Role        | Packages                                                             |
| ----------- | -------------------------------------------------------------------- |
| Consumers   | `sparql-db-impl`, `store-factory`                                    |
| Complements | `@graviola/remote-query-implementations` (CRUD HTTP for live stores) |

## Key concepts

- **URL normalization.** `normalizeSparqlBase` strips trailing slashes and `/query`, `/update`, `/store`, or `/sparql` suffixes. `sparqlEndpointUrls` returns `{ base, query, update, store }` for a configured endpoint string.
- **Graph Store URLs.** `graphStoreUrl` builds `?default` or `?graph=<IRI>` targets for GSP GET/POST.
- **Dump/load/clear.** `dumpQuads` tries GSP first, then falls back to `CONSTRUCT WHERE { ?s ?p ?o }`. `loadQuads` POSTs N-Quads. `clearGraph` sends `CLEAR DEFAULT` or `CLEAR GRAPH <…>` via the update URL; named graph IRIs are validated with `assertSafeIri`.
- **CLI.** The `sparql-tools` binary wraps the same three operations (`dump`, `load`, `clear`).

## Installation

```bash
bun add @graviola/sparql-tools
# or
npm install @graviola/sparql-tools
```

## Usage

```ts
import {
  dumpQuads,
  graphStoreUrl,
  loadQuads,
  normalizeSparqlBase,
  sparqlEndpointUrls,
} from "@graviola/sparql-tools";

const endpoint = "http://localhost:7878/sparql/query";

// Resolve service URLs from any common endpoint shape
const urls = sparqlEndpointUrls(endpoint);
console.log(urls.query); // http://localhost:7878/sparql/query
console.log(normalizeSparqlBase(endpoint)); // http://localhost:7878/sparql
console.log(graphStoreUrl(urls.store)); // …/store?default

// Dump and reload (requires a running SPARQL HTTP service)
const nquads = await dumpQuads({ endpoint });
await loadQuads({ endpoint, nquads });
```

## API reference

The full list of exports is in the generated TypeDoc API documentation (`bun run docs` at the repository root). Every export has a doc comment in `src/`.

## License

MIT
