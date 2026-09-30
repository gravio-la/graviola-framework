# @graviola/sparql-db-impl

The SPARQL backend of Graviola's capability-typed `Store<R>`: wire a JSON Schema and SPARQL fetch functions to load, filter, search, and write entities over any RDF triple store.

![Layer: 2 (Schema → Query)](https://img.shields.io/badge/Layer-2%20Schema%20to%20Query-blue)
![Environment: Universal](https://img.shields.io/badge/Environment-Browser%20%2B%20Bun%20%2B%20Node-green)

## Why this package exists

Graviola applications speak JSON shaped by a JSON Schema, but SPARQL endpoints speak RDF graphs. This package is the **SPARQL backend** of `Store<R>` from `@graviola/store-core`: it turns schema-driven CRUD into SPARQL, runs it through your endpoint, and returns typed JSON.

The pipeline is split across Layer 2 packages on purpose:

- **`@graviola/sparql-schema`** builds CONSTRUCT, SELECT, INSERT, and DELETE from the schema.
- **`@graviola/edb-graph-traversal`** shapes CONSTRUCT results back into JSON documents.
- **`@graviola/remote-query-implementations`** (or an in-process Oxigraph `Store`) executes SPARQL over HTTP or WASM.

`sparql-db-impl` composes those pieces into one store object with capability metadata, change events, and optional entity or statement metadata.

## Position in the framework

The package is in **Layer 2 (Schema → Query)**. It has no React. It depends on `@graviola/sparql-schema`, `@graviola/store-core`, `@graviola/remote-query-implementations`, and related Layer 1/2 utilities. It runs unchanged in the browser, in Bun CLIs, and in the datastore contract tests. Adding React, MUI, or any browser-only dependency here is a breaking change for server-side users, even if no test fails.

| Role        | Packages                                                             |
| ----------- | -------------------------------------------------------------------- |
| Composition | `store-factory` (the usual way to create a SPARQL store)             |
| Providers   | `sparql-store-provider`, `local-oxigraph-store-provider`             |
| Extensions  | `meilisearch-sparql-store` (search layered on top of a SPARQL store) |
| Contract    | `datastore-tests` (shared CRUD suites against every SPARQL adapter)  |

## Key concepts

- **`initSPARQLStore(config)`.** Preferred entry point. Returns a capability-typed `SparqlStore<R>` wired to your schema, prefix map, and `sparqlQueryFunctions` (`constructFetch`, `updateFetch`, `askFetch`, `selectFetch`).
- **`initSPARQLDatastorePair(config)`.** Returns `{ store, abstractDatastore }`. The store is the same object as above; `abstractDatastore` is the legacy `AbstractDatastore` view kept for adapters not yet migrated. **Deprecated** — prefer `initSPARQLStore`.
- **Capabilities.** The store advertises what it implements via `capabilities` and `profiles`: `loads`, `lists`, `filters`, `searches`, `counts`, `writes`, `removes`, `streams`, `exists`, `resolves`, `flatResultSet`, and `speaksNative` (`"sparql"`). When `statementMeta` is configured, `statements` is also enabled. Check with `hasCapability` from `@graviola/store-core` before calling optional surfaces.
- **Statement metadata (`statementMeta`).** Opt-in fact-level provenance on individual property values. Configure `policies` (which paths are statement-backed), `encoding` (`"statement-node"` or `"rdf-12"` — the latter needs an RDF 1.2 engine such as Oxigraph ≥ 0.5), and `retention` (`"all"`, `"latest"`, or `{ keepLast: n }`, with optional per-path overrides in `retentionByPath` keyed as `"TypeName.dot.path"`).
- **Change bus.** Each store owns a pub/sub bus from `createChangeBus`. `store.subscribe` receives `EntityChangeEvent` values (`"upsert"` with optional typed `data`, or `"remove"`) after writes and removes; `store.emit` is the same bus for manual notifications.
- **IRI validation.** SPARQL built through `@graviola/sparql-schema` validates every IRI with `isSafeIri` from `@graviola/edb-core-utils`. Invalid IRIs throw `InvalidIriError` rather than reaching the endpoint.

## Installation

```bash
bun add @graviola/sparql-db-impl
# or
npm install @graviola/sparql-db-impl
```

You also need a SPARQL execution layer: `@graviola/remote-query-implementations` for HTTP endpoints, or the `oxigraph` npm package for an in-process WASM store (as in the example below).

## Usage

In-process Oxigraph (same pattern as `apps/datastore-tests/src/adapters/oxigraphLocalAdapter.ts`):

```ts
import type { CRUDFunctions } from "@graviola/edb-core-types";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import datasetFactory from "@rdfjs/dataset";
import type { Quad } from "@rdfjs/types";
import type { JSONSchema7 } from "json-schema";
import { Store } from "oxigraph";

const BASE = "http://example.org/test#";
const CLASS_IRI = `${BASE}Person`;
const ENTITY_IRI = `${BASE}person/1`;

const schema = {
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string", const: CLASS_IRI },
        name: { type: "string" },
      },
      required: ["name"],
    },
  },
} satisfies JSONSchema7;

const typeNameToTypeIRI = (name: string) =>
  name === "Person" ? CLASS_IRI : `${BASE}${name}`;

function makeSyncStoreCRUDFunctions(oxi: Store): CRUDFunctions {
  return {
    askFetch: async (query: string) => Boolean(oxi.query(query)),
    constructFetch: async (query: string) => {
      const quads = (oxi.query(query) as Quad[]) ?? [];
      return datasetFactory.dataset(quads);
    },
    updateFetch: async (query: string) => {
      oxi.update(query);
    },
    selectFetch: ((query: string, options?: { withHeaders?: boolean }) => {
      const raw = oxi.query(query, {
        results_format: "application/sparql-results+json",
      }) as string;
      const parsed = JSON.parse(raw || "{}");
      return Promise.resolve(
        options?.withHeaders ? parsed : (parsed.results?.bindings ?? []),
      );
    }) as CRUDFunctions["selectFetch"],
  };
}

const oxi = new Store();
const store = initSPARQLStore({
  schema,
  defaultPrefix: BASE,
  jsonldContext: { "@vocab": BASE },
  typeNameToTypeIRI,
  queryBuildOptions: {
    typeIRItoTypeName: (iri) => (iri === CLASS_IRI ? "Person" : "Unknown"),
    primaryFields: { Person: { label: "name" } },
    primaryFieldExtracts: {},
    propertyToIRI: (prop: string) => `${BASE}${prop}`,
    sparqlFlavour: "oxigraph",
  },
  sparqlQueryFunctions: makeSyncStoreCRUDFunctions(oxi),
  defaultLimit: 50,
});

await store.upsert("Person", ENTITY_IRI, {
  "@id": ENTITY_IRI,
  "@type": CLASS_IRI,
  name: "Ada Lovelace",
});

const person = await store.loadOne("Person", ENTITY_IRI);
// { "@id": "...", "@type": "...", name: "Ada Lovelace" }
```

For remote endpoints, pass HTTP-backed `CRUDFunctions` from `@graviola/remote-query-implementations` instead of the synchronous Oxigraph helpers, or use `store-factory`'s `createSparqlStore` / `createOxigraphStore` presets.

## API reference

The full list of exports is in the generated TypeDoc API documentation (`bun run docs` at the repository root). Every export has a doc comment in `src/`.

## Known issues

- **`initSPARQLStore.ts` is large (~1,150 lines).** It will be split into smaller modules; this README documents the current surface only.
- **Deprecated `AbstractDatastore` factories.** `initSPARQLAbstractDatastore`, `initSPARQLDatastorePair`, and `initRemoteOxigraphDatastore` remain for contract tests and legacy adapters. New code should use `initSPARQLStore` and the `@graviola/store-core` capability API.

## License

MIT
