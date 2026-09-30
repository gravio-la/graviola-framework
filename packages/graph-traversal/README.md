# @graviola/edb-graph-traversal

RDF graph → JSON extraction guided by JSON Schema: walk relations as deep as the traversal schema allows and stop at named-entity boundaries.

![Layer: 2 (Schema → Query)](https://img.shields.io/badge/Layer-2%20Schema%20to%20Query-blue)
![Environment: Universal](https://img.shields.io/badge/Environment-Browser%20%2B%20Bun%20%2B%20Node-green)

## Why this package exists

Graviola stores entities as RDF graphs, but applications consume JSON shaped by a JSON Schema. This package turns an RDF/JS dataset into those JSON documents: it follows relations as deep as the traversal schema allows and stops at **named-entity boundaries** (Concise Bounded Descriptions). SPARQL CONSTRUCT results, in-memory datasets and IndexedDB-backed stores all pass through the same extraction path on the way back to typed JSON.

## Position in the framework

The package is in **Layer 2 (Schema → Query)**. It has no React. It depends on `@graviola/edb-core-utils`, `@graviola/json-schema-utils`, `@graviola/typed-query-types`, `clownface`, and lists `ajv` as a peer dependency for typed-filter validation. It runs unchanged in the browser, in Bun CLIs, and in the datastore contract tests. Adding React, MUI, or any browser-only dependency here is a breaking change for server-side users, even if no test fails.

Typical consumers:

| Area              | Packages                   | Uses                                                                   |
| ----------------- | -------------------------- | ---------------------------------------------------------------------- |
| Query and load    | `sparql-schema`            | `buildTraversalSchema`, `traverseGraphExtractBySchema` after CONSTRUCT |
| JSON-LD cleanup   | `jsonld-utils`             | `traverseGraphExtractBySchema` on expanded graphs                      |
| Browser storage   | `indexeddb-store-provider` | Extract entities from persisted RDF datasets                           |
| Import pipeline   | `edb-import-staging`       | Shape staged RDF into schema-typed records                             |
| Maintenance tools | `maintenance-utils`        | Bulk graph inspection and export helpers                               |

## Key concepts

- **`traverseGraphExtractBySchema`.** The main entry point: given a base IRI, an entity IRI, an RDF/JS dataset, and a JSON Schema, walk the graph and return a JSON object with `@id`, `@type`, and the properties declared in the schema.
- **Traversal schemas and includes with `maxRecursion`.** Typed filters carry an `include`/`select` shape. `buildTraversalSchema` and `projectSchema` turn that into a trimmed schema the extractor can follow, honouring `maxRecursion` so nested relations are not walked forever.
- **Ordering and slicing of included relations.** `applyIncludeOrderByAndSlice` and `normalizeOrderBy` sort and paginate related entities after extraction, matching the order/limit the caller asked for in the filter.
- **The CBD boundary.** When a sub-schema declares an identity key (default `@id`), extraction stops there and returns a reference instead of inlining the whole subgraph. The canonical rule lives in `@graviola/json-schema-utils` (`cbdBoundaryScopes`, `isNamedEntityBoundaryAtScope`); this package applies it during the walk.
- **Selection depth.** How many nested levels a typed filter may request is resolved in `@graviola/typed-query-types` (`selectionDepth`, `resolveEffectiveMaxRecursion`). Graph traversal consumes the result when building traversal schemas.

## Installation

```bash
bun add @graviola/edb-graph-traversal
# or
npm install @graviola/edb-graph-traversal
```

Peer dependencies: `@rdfjs/data-model`, `ajv`, and optionally `ajv-formats` for typed-filter validation.

## Usage

```ts
import { traverseGraphExtractBySchema } from "@graviola/edb-graph-traversal";
import datasetFactory from "@rdfjs/dataset";
import namespace from "@rdfjs/namespace";
import { rdf, schema } from "@tpluscode/rdf-ns-builders";
import clownface from "clownface";
import type { JSONSchema7 } from "json-schema";

const baseIRI = "http://schema.org/";

// Build a small in-memory dataset.
const dataset = datasetFactory.dataset();
const cf = clownface({ dataset });

const john = cf.namedNode("http://example.com/person/john-doe");
john
  .addOut(rdf.type, schema.Person)
  .addOut(schema.name, "John Doe")
  .addOut(namespace(baseIRI)("age"), 30);

const jane = cf.namedNode("http://example.com/person/jane-doe");
jane.addOut(rdf.type, schema.Person).addOut(schema.name, "Jane Doe");
john.addOut(schema.knows, jane);

const personSchema: JSONSchema7 = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
    knows: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" } },
      },
    },
  },
};

const result = traverseGraphExtractBySchema(
  baseIRI,
  "http://example.com/person/john-doe",
  dataset,
  personSchema,
  { maxRecursion: 2, omitEmptyArrays: true, omitEmptyObjects: true },
);

// {
//   "@id": "http://example.com/person/john-doe",
//   "@type": "http://schema.org/Person",
//   name: "John Doe",
//   age: 30,
//   knows: [{ "@id": "...", "@type": "...", name: "Jane Doe" }]
// }
```

## API reference

The full list of exports is in the generated TypeDoc API documentation (`bun run docs` at the repository root). Every export has a doc comment in `src/`.

## Known issues

- Test coverage has not been measured since the Jest → `bun test` migration.
- `extractor/extractObject.ts` still carries a high density of `any` types; tightening those types is tracked but not yet done.

## License

MIT
