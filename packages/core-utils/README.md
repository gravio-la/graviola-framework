# @graviola/edb-core-utils

Small, dependency-light helpers shared across Graviola: IRI encoding for URLs, JSON-LD result shaping, special dates, entity previews and thumbnails, and SPARQL feature flags and query logging.

![Layer: 1 (Foundation)](https://img.shields.io/badge/Layer-1%20Foundation-blue)
![Environment: Universal](https://img.shields.io/badge/Environment-Browser%20%2B%20Bun%20%2B%20Node-green)

## Why this package exists

Graviola packages need the same small operations in many places:

- encode an IRI so it is safe in a URL path or query string
- strip nullish values from arrays before building queries
- turn numeric dates (YYYYMMDD) into form-friendly parts
- resolve entity preview labels and thumbnail URLs from schema-shaped data
- pick SPARQL dialect features and log queries with optional correlation keys

This package is where those helpers live. **Rule for contributors:** helpers here must not duplicate lodash or the platform. If lodash or a built-in does it, use that instead of adding another export. See "Reuse before reinvent" in the repository's `CLAUDE.md`.

## Position in the framework

The package is in **Layer 1 (Foundation)**. It depends only on `@graviola/edb-core-types` and `lodash-es`, and it must stay that way. It runs unchanged in the browser, in Bun CLIs and in the datastore contract tests. Adding React, MUI or any browser-only API without a Node/Bun fallback is a breaking change for server-side users, even if no test fails.

Typical consumers:

| Area            | Packages                                                                                                   | Uses                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Query stack     | `sparql-schema`, `edb-graph-traversal`, `sparql-db-impl`, `remote-query-implementations`, `prisma-db-impl` | `filterUndefOrNull`, `resolveSparqlFeatures`, `QUERY_RESULT_SUBJECT_IRI`, `isValidUrl` |
| State and views | `edb-state-hooks`, `edb-detail-renderer`                                                                   | `extractEntityPreview`, `resolvePreviewDisplay`, `applyResolveThumbnailUrl`            |
| Store providers | `sparql-store-provider`, `local-oxigraph-store-provider`                                                   | `sparqlLoggingWrapper`                                                                 |
| Forms           | `edb-basic-renderer`, `edb-linked-data-renderer`                                                           | special dates, `irisToData`, `makeFormsPath`                                           |

## Key concepts

- **`encodeIRI` / `decodeIRI`.** IRIs are encoded as base64url of their UTF-8 bytes (no padding), so the result is safe in URL paths and query strings and does not crash on non-ASCII characters. `decodeIRI` also accepts legacy standard base64 values, including ones damaged when query-string parsing turned `+` into a space.
- **Special dates.** Graviola stores partial calendar dates as numbers in YYYYMMDD form (for example `20230915`). The `getDateParts` family splits that into year, month and day components for forms and renderers; `getPaddedDate` and related helpers format parts back into the numeric representation.
- **SPARQL query logging.** Wrap a store with `sparqlLoggingWrapper` to log each query. For optional correlation with TanStack Query (or any async caller), wrap the query function with `runWithSparqlQueryKey`. Only one concurrent key is tracked; parallel overlapping async work may show the wrong key.

## Installation

```bash
bun add @graviola/edb-core-utils
# or
npm install @graviola/edb-core-utils
```

## Usage

```ts
import {
  decodeIRI,
  encodeIRI,
  filterUndefOrNull,
} from "@graviola/edb-core-utils";

const iri = "http://example.org/Müller/Straße";
const encoded = encodeIRI(iri);
console.log(encoded); // aHR0cDovL2V4YW1wbGUub3JnL03DvGxsZXIvU3RyYcOfZQ
console.log(decodeIRI(encoded)); // http://example.org/Müller/Straße

console.log(filterUndefOrNull([1, null, 2, undefined, 3])); // [ 1, 2, 3 ]
```

## API reference

The full list of exports is in the generated TypeDoc API documentation (`bun run docs` at the repository root). Every export has a doc comment in `src/`.

## License

MIT
