# @graviola/json-schema-utils

JSON Schema helpers that every other Graviola package builds on: resolving `$ref`s and scopes, working with named definitions, finding entity boundaries, and fingerprinting schemas.

![Layer: 1 (Foundation)](https://img.shields.io/badge/Layer-1%20Foundation-blue)
![Environment: Universal](https://img.shields.io/badge/Environment-Browser%20%2B%20Bun%20%2B%20Node-green)

## Why this package exists

In Graviola, a **JSON Schema is the runtime source of truth**. Forms, tables, detail views, SPARQL and Prisma queries, and validation are all derived from the same schema at runtime. Each of those derivations needs the same small operations:

- "which definition does this `$ref` point to?"
- "what is the sub-schema at this scope?"
- "is this sub-schema an entity with its own `@id`, or an anonymous value?"

This package is the one place those operations live. It is used by about 30 other `@graviola/*` packages, more than any other package in the framework.

**Rule for contributors:** before you parse a `$ref`, a JSON Pointer or a definition name in another package, look here first. If the helper you need is missing, add it here and import it. Don't copy a regex into a Layer 2+ package. See "Reuse before reinvent" in the repository's `CLAUDE.md`.

## Position in the framework

The package is in **Layer 1 (Foundation)**. It depends only on `lodash-es` and `@graviola/edb-core-utils`, and it must stay that way. It runs unchanged in the browser, in Bun CLIs and in the datastore contract tests. Adding React, MUI or any browser-only dependency here is a breaking change for server-side users, even if no test fails.

Typical consumers:

| Area              | Packages                                                                                               | Uses                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Query generation  | `sparql-schema`, `edb-graph-traversal`, `json-schema-prisma-utils`, `prisma-db-impl`, `sparql-db-impl` | `resolveSchema`, `bringDefinitionToTop`, `isJSONSchema`, CBD boundaries, entity identity, skolem IRIs |
| Forms and views   | `semantic-json-form`, `edb-detail-renderer(-core)`, `edb-linked-data-renderer`, table renderers        | `resolveSchema`, schema scope frames, `extractTypeIRI`, `prepareStubbedSchema`                        |
| State             | `edb-state-hooks`                                                                                      | `bringDefinitionToTop`, `stripXCalcProperties`, `extractTypeIRI`                                      |
| Calculated fields | `formula-dependency`, `formula-runtime`, `calc-engine`                                                 | `definitionNameFromScope`, `definitionScope`, `getSubschemaByPath`                                    |

## Key concepts

- **Scope vs. data path.** A _scope_ (`#/definitions/Person/properties/name`) points into the **schema**. A _data path_ (`["name"]`) points into an **instance**. Scope helpers (`resolveSchema`, `definitionNameFromScope`) work on the schema. Schema scope frames (`rootFrame`, `enterPropertyFrame`, …) keep both in step while a renderer walks the schema and the data together.
- **`definitions` and `$defs`.** Both keywords are accepted everywhere. `defs(schema)` returns whichever one the document uses, and `definitionScope(name, schema)` builds a pointer with the document's own keyword.
- **Entity identity and CBD boundaries.** A sub-schema that declares an identity key (default `@id`, or `id` for Prisma) is a **named entity**, the root of a Concise Bounded Description. Query builders stop graph extraction there, and provenance metadata is attached there. `cbdBoundaryScopes` and `isNamedEntityBoundaryAtScope` find these roots. Pass the same identity keys you used with `extendSchemaShortcut`.
- **Skolem IRIs.** Anonymous list members get deterministic IRIs derived from a content hash (`skolemListMemberIri`, `assignSkolemIris`), so re-saving the same data produces the same triples.

## Installation

```bash
bun add @graviola/json-schema-utils
# or
npm install @graviola/json-schema-utils
```

## Usage

```ts
import {
  bringDefinitionToTop,
  definitionNameFromScope,
  definitionScope,
  extractTypeIRI,
  resolveSchema,
} from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";

const schema: JSONSchema7 = {
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "http://schema.org/Person" },
        name: { type: "string" },
        knows: { $ref: "#/definitions/Person" },
      },
    },
  },
};

// Make one definition the root schema, keeping `definitions` so $refs still resolve.
const person = bringDefinitionToTop(schema, "Person");

definitionNameFromScope("#/definitions/Person/properties/name"); // "Person"
definitionScope("Person", schema); // "#/definitions/Person"
extractTypeIRI(person); // "http://schema.org/Person"

// Sub-schema at a scope, following $refs against the root schema.
resolveSchema(person, "#/properties/knows", person);
```

## API reference

The full list of exports is in the generated TypeDoc API documentation (`bun run docs` at the repository root). Every export has a doc comment in `src/`.

## License

MIT
