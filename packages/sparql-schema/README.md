# @graviola/sparql-schema

JSON Schema → SPARQL translation and CRUD helpers for RDF triple stores.

![Layer: 2 (Schema → Query)](https://img.shields.io/badge/Layer-2%20Schema%20to%20Query-blue)
![Environment: Universal](https://img.shields.io/badge/Environment-Browser%20%2B%20Bun%20%2B%20Node-green)

## Why this package exists

Graviola stores entities as RDF graphs, but applications work with JSON shaped by a JSON Schema. This package turns those schema definitions into SPARQL: **CONSTRUCT** for loading entity graphs, **SELECT** for lists and filters, and **INSERT/DELETE** for saves, plus the CRUD helpers that run them against a SPARQL endpoint. It is the query layer under `@graviola/sparql-db-impl`.

## Position in the framework

The package is in **Layer 2 (Schema → Query)**. It has no React. It depends on `@graviola/edb-core-utils`, `@graviola/json-schema-utils`, `@graviola/edb-graph-traversal`, `@graviola/meta-schema`, `@graviola/jsonld-utils`, and the `@tpluscode/*` SPARQL builder stack. It runs unchanged in the browser, in Bun CLIs, and in the datastore contract tests. Adding React, MUI, or any browser-only dependency here is a breaking change for server-side users, even if no test fails.

Typical consumers:

| Area             | Packages                                                                        | Uses                                                                   |
| ---------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Store backends   | `sparql-db-impl`, `indexeddb-store-provider`, `store-factory` (via SPARQL impl) | `load`, `save`, `remove`, `filterTypedDocuments`, typed filter queries |
| Authority lookup | `wikidata-utils`                                                                | `prefixes2sparqlPrefixDeclaration`                                     |

## Key concepts

- **Schema → CONSTRUCT.** `jsonSchema2construct` builds the DELETE/INSERT CBD template for writes. `traversalSchema2construct` (with `buildTraversalSchema` from graph-traversal) builds the read CONSTRUCT, honouring `include`/`select` shapes and `maxRecursion`.
- **Typed filters → SPARQL.** `filterToSparql` translates Prisma-style `where` clauses into SPARQL patterns; `buildFilterableSPARQLQuery` assembles a full SELECT for list and filter operations.
- **CRUD over fetch functions.** `load`, `save`, `remove`, and `exists` take a `constructFetch` / `updateFetch` / `askFetch` pair instead of hard-coding an endpoint URL, so the same code runs against Oxigraph, Fuseki, or an in-memory store.
- **Finding entities.** `findEntityByClass`, `findEntityByAuthorityIRI`, and `searchEntityByLabel` cover common lookup patterns over a SELECT fetch function.
- **SPARQL safety.** Every IRI goes through `iriRef` (validated with `isSafeIri` from `@graviola/edb-core-utils`), literals through `sparqlStringLiteral`, variable names through `toSparqlVariableName`. Code that builds SPARQL outside this package should use them too.

## Installation

```bash
bun add @graviola/sparql-schema
# or
npm install @graviola/sparql-schema
```

## Usage

```ts
import {
  buildSPARQLConstructQuery,
  jsonSchema2construct,
  load,
  traversalSchema2construct,
} from "@graviola/sparql-schema";
import { buildTraversalSchema } from "@graviola/edb-graph-traversal";
import type { JSONSchema7 } from "json-schema";

const defaultPrefix = "http://example.org/";
const typeIRI = "http://example.org/Person";
const entityIRI = "http://example.org/person/1";

const schema: JSONSchema7 = {
  type: "object",
  properties: {
    "@id": { type: "string" },
    "@type": { const: typeIRI },
    name: { type: "string" },
  },
};

// Read path: traversal schema → CONSTRUCT query
const traversal = buildTraversalSchema(schema);
const constructResult = traversalSchema2construct(
  entityIRI,
  typeIRI,
  traversal,
  {
    prefixMap: { "": defaultPrefix },
    maxRecursion: 2,
  },
);
const query = buildSPARQLConstructQuery(constructResult, { "": defaultPrefix });

// Write path: CBD DELETE/INSERT template (stops at nested @id boundaries)
const { construct: deleteTemplate } = jsonSchema2construct(entityIRI, schema, [
  "@id",
]);

// load runs the CONSTRUCT through your fetch function and extracts JSON
const constructFetch = async (sparqlQuery: string) => {
  // Same closure shape as sparql-db-impl: POST the query, return RDF/JS DatasetCore.
  return endpoint.construct(sparqlQuery);
};

const { document } = await load(entityIRI, typeIRI, schema, constructFetch, {
  defaultPrefix,
});
```

## API reference

The full list of exports is in the generated TypeDoc API documentation (`bun run docs` at the repository root). Every export has a doc comment in `src/`.

## Known issues before the next release

- **42 % line coverage** — many CRUD and filter paths are only exercised indirectly through store backends.
- **Remaining generic template sites** — SPARQL is still assembled through tagged-template interpolations in several internal builders; LIMIT/OFFSET and filter literals are guarded, but the template count should keep shrinking.
- **`any` density** — legacy CRUD result types and filter dispatch still carry explicit `any` annotations that should be narrowed.

## License

This package is part of the Graviola project.
