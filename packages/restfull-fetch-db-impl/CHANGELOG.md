# @slub/sparql-db-impl

## 1.6.3

### Patch Changes

- Updated dependencies [6d44d8d]
  - @graviola/rest-store-client@0.3.2

## 1.6.2

### Patch Changes

- @graviola/rest-store-client@0.3.2

## 1.6.1

### Patch Changes

- fix version pinning issues
- Updated dependencies
  - @graviola/rest-store-client@0.3.1

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
  - @graviola/rest-store-client@0.3.0

## 1.5.8

### Patch Changes

- Add `@graviola/rest-store-client`: HTTP `RESTClientStore` (v1 wire), `LegacyRESTClientStore` (v0 URLs), discovery handshake helpers, shared transport utilities, optional AbstractDatastore shim, specs under `spec/`, and generated OpenAPI 3.1. Delegate `@graviola/restfull-fetch-db-impl` through the new client package and wire `@graviola/rest-store-provider` to use `LegacyRESTClientStore` + shim directly.
- Updated dependencies
- Updated dependencies
  - @graviola/rest-store-client@0.2.0

## 1.5.7

### Patch Changes

- fixing wrong package pinning in release pipeline

## 1.5.2

### Patch Changes

- packaging fixes

## 1.5.1

### Patch Changes

- fixing catalog packaging

## 1.5.0

### Minor Changes

- typesafe filters and redesigned sparql and graph extraction architecture, bug fixes, api stabilisation, features

## 1.4.0

### Minor Changes

- stabelize, streamline query hooks, cleanup

## 1.3.0

### Minor Changes

- adding count functionality

## 1.2.4

### Patch Changes

- make workspace depenedncies peer depenedncies

## 1.2.3

### Patch Changes

- cleaned up interfaces and simplified initialization of provider and initial setup

## 1.2.1

### Patch Changes

- updated to react-query version 5 and fixes

## 1.2.0

### Minor Changes

- massive refactoring due to separation of dependencies in order to publish the library for universal reuse

## 1.1.0

### Minor Changes

- stabilizing interfaces and make UX and Design improvements in all areas, translation and behavioral adaptation

### Patch Changes

- Updated dependencies
  - @slub/exhibition-schema@1.3.0
  - @slub/exhibition-sparql-config@1.1.0
  - @slub/edb-core-types@1.1.0
  - @slub/edb-global-types@1.1.0
  - @slub/edb-graph-traversal@1.1.0
  - @slub/json-schema-utils@1.1.0
  - @slub/sparql-schema@1.1.0
