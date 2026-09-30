# @slub/sparql-schema

## 1.8.0

### Minor Changes

- 34ce6b4: Remove unused exports (cast helpers, variable helpers, trash queries, field-mapping select, loadEntityBasics); internal query builders and filter operators are no longer exported. Filters use CONTAINS/STRSTARTS instead of REGEX, and LIMIT/OFFSET must be non-negative integers. graph-traversal exports `isNestedFilterOptions` and `extractNestedFilterOptions`.

### Patch Changes

- 34ce6b4: Remove unused exports and the alias `extractCBDShouldHalt`; internal helpers are no longer exported; selection-depth helpers are imported from `@graviola/typed-query-types` directly; tests run on bun; `edb-core-types`/`edb-global-types` are regular dependencies.
- 34ce6b4: README rewrite.
- Updated dependencies [34ce6b4]
- Updated dependencies [34ce6b4]
- Updated dependencies [34ce6b4]
  - @graviola/edb-graph-traversal@1.8.0
  - @graviola/jsonld-utils@1.6.6

## 1.7.0

### Minor Changes

- 8c5c380: Rename schema-prep APIs away from the "normalize" misnomer: dereference + project → traversal schema.
  - `@graviola/edb-graph-traversal`: `normalizeSchema` → `buildTraversalSchema`, `NormalizedSchema` → `TraversalSchema` (`_traversalSchema`), `resolveAllRefs` → `dereferenceSchema`, `applyFilters` → `projectSchema`; module path `normalizer/` → `traversal-schema/`. Reserve "normalize"/"canonicalize" for true normal-form transforms (e.g. `canonicalizeSchemaForFingerprint`).
  - `@graviola/sparql-schema`: `normalizedSchema2construct` → `traversalSchema2construct`.
  - `@graviola/edb-import-staging`: `normalizeStagedDocument` → `prepareStagedDocument`.

  **Breaking:** no legacy aliases — update imports and call sites to the new names.

### Patch Changes

- 1177e2a: Fix annotationProjectionsToSparql to correctly walk intermediate path segments for nested meta annotations. Now generates proper triple patterns for scopes like $meta/provenance/activityId instead of skipping intermediate nodes. Deduplicates shared path segments across multiple projections.
- 7c6208f: Security: IRIs are validated before they are placed into SPARQL queries and updates, and the REST server rejects invalid entity IRIs with `400 invalid_entity_iri`. `@graviola/edb-core-utils` adds `isSafeIri`, `assertSafeIri` and `InvalidIriError`; `@graviola/sparql-schema` adds `iriRef`, `sparqlStringLiteral` (full escaping) and `toSparqlVariableName` (replacing three local copies).
- 7ba3560: fix(sparql-schema): never expand the DELETE template of `save`/`remove` into linked named entities

  `jsonSchema2construct` builds the DELETE side of the DELETE/INSERT issued on every save. Its only
  recursion boundary was the TBox stop symbol `@id`; schema artifacts that omit `@id` on referenced
  definitions (e.g. LinkML-generated models without identifier slots) made the template expand up to
  four levels into linked IRIs and wipe them (`Location.parent` → parent, grand-parent … lost all
  triples on each save; `Place.location` / `Place.parent` overwrote each other's targets).

  Every nested expansion is now additionally anchored in its own
  `OPTIONAL { <link> FILTER(isBlank(?o)) … }` group — the Concise Bounded Description proper: only
  anonymous (blank-node) sub-objects owned by the subject are ever expanded; IRIs are never followed
  regardless of the schema. Link triples are still matched on their own so stale references are removed.
  Nested patterns are all OPTIONAL (deletion wants maximal matching), which also fixes stale links that
  survived when a linked target lacked a schema-`required` property.

  Adds an in-process Oxigraph contract suite (`apps/datastore-tests/src/cbd-boundary.test.ts`) covering
  both schema shapes (with and without `@id`).

- Updated dependencies [e46e114]
- Updated dependencies [35bd287]
- Updated dependencies [ed91138]
- Updated dependencies [8c5c380]
- Updated dependencies [7c6208f]
  - @graviola/edb-core-utils@1.7.0
  - @graviola/json-schema-utils@1.8.0
  - @graviola/meta-schema@0.2.0
  - @graviola/edb-graph-traversal@1.7.0
  - @graviola/jsonld-utils@1.6.5

## 1.6.4

### Patch Changes

- @graviola/edb-core-utils@1.6.1
- @graviola/edb-graph-traversal@1.6.4
- @graviola/jsonld-utils@1.6.4
- @graviola/json-schema-utils@1.7.2

## 1.6.3

### Patch Changes

- Updated dependencies
  - @graviola/edb-core-utils@1.6.0
  - @graviola/edb-graph-traversal@1.6.3
  - @graviola/jsonld-utils@1.6.3
  - @graviola/json-schema-utils@1.7.1

## 1.6.2

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.7.0
  - @graviola/edb-graph-traversal@1.6.2
  - @graviola/jsonld-utils@1.6.2

## 1.6.1

### Patch Changes

- fix version pinning issues
- Updated dependencies
  - @graviola/edb-core-utils@1.5.8
  - @graviola/edb-graph-traversal@1.6.1
  - @graviola/json-schema-utils@1.6.1
  - @graviola/jsonld-utils@1.6.1

## 1.6.0

### Minor Changes

- ### Store (`@graviola/store-core`) and provider wiring
  - **`Store<R>`** is the primary runtime seam: capability guards, descriptor tweaks, and datastore contract tests now assert against `Store` instead of legacy-only `AbstractDatastore` checks.
  - **`@graviola/edb-state-hooks`**: `useDataStore`, typed/anyOf filter stores, and CRUD hooks read/write through the store layer; `crudDatastoreStore` bridges provider context.
  - **Providers** (`local-oxigraph`, `sparql`, `rest`) and **UI consumers** (`advanced-components`, `table-components`, `data-mapping-hooks`) updated to the new types; `sparql-db-impl` exports `SPARQLDataStoreConfig` as a **type-only** export.

  ### REST storage split
  - New **`@graviola/rest-store-client`**: HTTP `Store` implementations (v0 shim + v1 wire).
  - **`@graviola/restfull-fetch-db-impl`** now depends on `rest-store-client` instead of inlining fetch logic; **`@graviola/rest-store-provider`** follows the same client.

  ### IndexedDB local RDF (new packages)
  - **`@graviola/indexeddb-dataset`**: persistent RDF dataset on IndexedDB (term dictionary, write buffer, async `match()`, debug logging).
  - **`@graviola/indexeddb-store-provider`**: React provider + Comunica SPARQL adapter over the dataset; adds **in-memory** and **traverse-wrapped in-memory** providers for tests and dev workflows.
  - **testapp** `GraviolaProvider` reorganized; IndexedDB was wired then **removed from testapp deps** — storage is selected via **`endpoint`** prop again (IndexedDB remains available as a library provider).

  ### Detail views
  - **`@graviola/edb-detail-renderer-core`**: structural testers and UISchema generation updates; `EntityRefRenderer` → **`NamedEntityRenderer`**.
  - **`@graviola/edb-detail-renderer`**: `DetailEntityModal`, inline sub-dispatch, `ArrayInlineObjectRenderer`, chip/layout improvements.
  - **`@graviola/edb-advanced-components`**: `EntityDetailModal` enhancements; **`hidePaginationWhenSinglePage`** on paginated lists.
  - **`semantic-jsonform-types`**: `EntityDetailModalProps.onClose`, `ReactNode` typing cleanup (transitive bump via dependents).

  ### SPARQL, filters, schema utilities
  - **`@graviola/sparql-schema`**: top-level **relationship filter operators** with nested filtering; Zod dropped from package surface / examples trimmed.
  - **`@graviola/edb-graph-traversal`**: root-level **`where`** property `$ref` resolution in schema normalization.
  - **`@graviola/json-schema-utils`**: stub/schema reference renames; testapp item schema uses **`makeSchemaConfig`**.

  ### Tooling and docs (non-package)
  - Monorepo **Bun 1.3.14** via `bun-binary-package.nix` / `flake.nix`.

### Patch Changes

- Updated dependencies
  - @graviola/edb-graph-traversal@1.6.0
  - @graviola/json-schema-utils@1.6.0
  - @graviola/jsonld-utils@1.6.0
  - @graviola/edb-core-utils@1.5.7

## 1.5.10

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.5.8
  - @graviola/edb-graph-traversal@1.5.8
  - @graviola/edb-core-utils@1.5.7
  - @graviola/jsonld-utils@1.5.9

## 1.5.9

### Patch Changes

- fixing wrong package pinning in release pipeline
- Updated dependencies
  - @graviola/json-schema-utils@1.5.7
  - @graviola/edb-graph-traversal@1.5.7
  - @graviola/jsonld-utils@1.5.8
  - @graviola/edb-core-utils@1.5.7

## 1.5.8

### Patch Changes

- fixed greedy delete bug

## 1.5.7

### Patch Changes

- Updated dependencies
  - @graviola/jsonld-utils@1.5.7

## 1.5.2

### Patch Changes

- packaging fixes
- Updated dependencies
  - @graviola/json-schema-utils@1.5.2
  - @graviola/edb-graph-traversal@1.5.2
  - @graviola/jsonld-utils@1.5.2
  - @graviola/edb-core-utils@1.5.2

## 1.5.1

### Patch Changes

- fixing catalog packaging
- Updated dependencies
  - @graviola/json-schema-utils@1.5.1
  - @graviola/edb-graph-traversal@1.5.1
  - @graviola/jsonld-utils@1.5.1
  - @graviola/edb-core-utils@1.5.1

## 1.5.0

### Minor Changes

- typesafe filters and redesigned sparql and graph extraction architecture, bug fixes, api stabilisation, features

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.5.0
  - @graviola/edb-graph-traversal@1.5.0
  - @graviola/jsonld-utils@1.5.0
  - @graviola/edb-core-utils@1.5.0

## 1.4.0

### Minor Changes

- cleanup , stability, virtuoso support, auth support, inverse queries

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.4.0
  - @graviola/jsonld-utils@1.3.0
  - @graviola/edb-graph-traversal@1.3.2
  - @graviola/edb-core-utils@1.4.0

## 1.3.1

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.3.1
  - @graviola/edb-graph-traversal@1.3.1
  - @graviola/jsonld-utils@1.2.1

## 1.3.0

### Minor Changes

- stabelize, streamline query hooks, cleanup

### Patch Changes

- Updated dependencies
  - @graviola/edb-core-utils@1.4.0
  - @graviola/edb-graph-traversal@1.3.0
  - @graviola/json-schema-utils@1.3.0
  - @graviola/jsonld-utils@1.2.0

## 1.2.6

### Patch Changes

- Updated dependencies
  - @graviola/edb-core-utils@1.3.0
  - @graviola/edb-graph-traversal@1.2.5
  - @graviola/jsonld-utils@1.1.5

## 1.2.5

### Patch Changes

- make workspace depenedncies peer depenedncies
- Updated dependencies
  - @graviola/json-schema-utils@1.2.4
  - @graviola/edb-graph-traversal@1.2.4
  - @graviola/jsonld-utils@1.1.4
  - @graviola/edb-core-utils@1.2.3

## 1.2.4

### Patch Changes

- better linked data handling
- Updated dependencies
  - @graviola/json-schema-utils@1.2.3
  - @graviola/jsonld-utils@1.1.3
  - @graviola/edb-graph-traversal@1.2.3

## 1.2.3

### Patch Changes

- cleaned up interfaces and simplified initialization of provider and initial setup
- Updated dependencies
  - @graviola/json-schema-utils@1.2.2
  - @graviola/edb-graph-traversal@1.2.2
  - @graviola/jsonld-utils@1.1.2
  - @graviola/edb-core-utils@1.2.2

## 1.2.2

### Patch Changes

- updated to react-query version 5 and fixes
- Updated dependencies
  - @graviola/json-schema-utils@1.2.1
  - @graviola/edb-graph-traversal@1.2.1
  - @graviola/jsonld-utils@1.1.1
  - @graviola/edb-core-utils@1.2.1

## 1.2.0

### Minor Changes

- massive refactoring due to separation of dependencies in order to publish the library for universal reuse

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.2.0
  - @graviola/edb-graph-traversal@1.2.0
  - @graviola/jsonld-utils@1.1.0
  - @graviola/edb-core-utils@1.2.0

## 1.1.0

### Minor Changes

- stabilizing interfaces and make UX and Design improvements in all areas, translation and behavioral adaptation
