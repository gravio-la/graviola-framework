# @graviola/edb-core-types

The shared TypeScript type vocabulary of the Graviola framework — RDF, SPARQL, entity fields, typed filters, and UI presentation contracts.

![Layer: 1 (Foundation)](https://img.shields.io/badge/Layer-1%20Foundation-blue)
![Environment: types only](https://img.shields.io/badge/Environment-types%20only-lightgrey)
![Environment: Universal](https://img.shields.io/badge/Environment-Browser%20%2B%20Bun%20%2B%20Node-green)

## Why this package exists

Graviola is spread across dozens of packages. They all need to agree on the same shapes — a SPARQL endpoint config, a primary-field declaration, a typed filter, a card presentation option — without importing each other's runtime code.

This package is that shared vocabulary. It exports **types only**; there is no runtime code here. Query builders, datastore adapters, mapping engines, and UI packages import from here so their interfaces stay aligned.

## Position in the framework

The package is in **Layer 1 (Foundation)**. It depends on `@rdfjs/types` and `@graviola/typed-query-types` (typed filters are re-exported from the latter). It must never gain runtime or React dependencies — adding either would break the browser/server symmetry that Layer 1 guarantees.

Typical consumers:

| Area         | Packages                                                                                       | Uses                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Query stack  | `sparql-schema`, `sparql-db-impl`, `remote-query-implementations`, `edb-graph-traversal`       | `SparqlEndpoint`, `SPARQLFlavour`, `CRUDFunctions`, `SparqlBuildOptions`, `WalkerOptions`, pagination and typed filters |
| Mapping      | `edb-data-mapping`                                                                             | `NormDataMapping(s)`, `PrimaryField*`                                                                                   |
| UI and state | `edb-state-hooks`, `edb-detail-renderer(-core)`, `graviola-app-config`, `edb-table-components` | Presentation and entity-action types                                                                                    |

## Key concepts

- **Three modules.** The foundation types live in `index.ts` (RDF/SPARQL, entity fields, mapping, pagination, logging). Presentation types (`CardPresentation`, `IconComponentLike`, thumbnail/preview vocabulary) live in `presentation.ts`. Entity-action types (`EntityActionDef`, `HostCapabilities`, …) live in `entityActions.ts`. All three are re-exported from the package entry point; import paths are unchanged. Presentation and entity-action types are UI vocabulary kept here for now — they may move to their own package later.
- **Primary fields.** A `PrimaryFieldDeclaration` maps entity type names to the property names that serve as label, description and image when rendering chips, cards and autocomplete suggestions. `PrimaryFieldExtract` and `PrimaryFieldResults` cover the extraction side in mapping and graph traversal.
- **The SPARQL vocabulary.** `SparqlEndpoint` describes a query endpoint (URL, auth, provider). `SPARQLFlavour` selects an engine profile (`default`, `oxigraph`, `blazegraph`, `allegro`, `jena`). `SparqlFeatureFlags` / `ResolvedSparqlFeatureFlags` express the resolved capability flags query code branches on. `CRUDFunctions` and `SparqlBuildOptions` wire the query stack together.
- **`IconComponentLike`.** Icons in presentation and entity-action types are typed structurally — a render function, an MUI `OverridableComponent`, or a plain object with `muiName` / `$$typeof` — so no React dependency is needed in this Layer 1 package.

## Installation

```bash
bun add @graviola/edb-core-types
# or
npm install @graviola/edb-core-types
```

## Usage

```ts
import type {
  PrimaryFieldDeclaration,
  SparqlEndpoint,
} from "@graviola/edb-core-types";

const endpoint: SparqlEndpoint = {
  label: "Local Oxigraph",
  endpoint: "http://localhost:7878/query",
  active: true,
  provider: "oxigraph",
};

const primaryFields: PrimaryFieldDeclaration = {
  Person: { label: "name", description: "bio", image: "photo" },
  Organisation: { label: "legalName", image: "logo" },
};
```

## API reference

The full list of exports is in the generated TypeDoc API documentation (`bun run docs` at the repository root). Every export has a doc comment in `src/`.

## License

MIT
