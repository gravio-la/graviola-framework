# @graviola/semantic-json-form

## 1.6.2

### Patch Changes

- @graviola/edb-state-hooks@1.7.2
- @graviola/edb-advanced-components@1.7.2
- @graviola/semantic-jsonform-types@1.4.10
- @graviola/edb-basic-components@1.5.2
- @graviola/entity-finder@1.5.2
- @graviola/edb-linked-data-renderer@6.0.2

## 1.6.1

### Patch Changes

- fix version pinning issues
- Updated dependencies
  - @graviola/edb-advanced-components@1.7.1
  - @graviola/edb-basic-components@1.5.1
  - @graviola/entity-finder@1.5.1
  - @graviola/edb-linked-data-renderer@6.0.1
  - @graviola/json-schema-utils@1.6.1
  - @graviola/jsonld-utils@1.6.1
  - @graviola/semantic-jsonform-types@1.4.9
  - @graviola/edb-state-hooks@1.7.1

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
  - @graviola/edb-advanced-components@1.7.0
  - @graviola/edb-basic-components@1.5.0
  - @graviola/edb-linked-data-renderer@6.0.0
  - @graviola/edb-state-hooks@1.7.0
  - @graviola/entity-finder@1.5.0
  - @graviola/json-schema-utils@1.6.0
  - @graviola/jsonld-utils@1.6.0
  - @graviola/semantic-jsonform-types@1.4.8

## 1.5.10

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.5.8
  - @graviola/edb-linked-data-renderer@5.0.10
  - @graviola/edb-state-hooks@1.6.9
  - @graviola/edb-advanced-components@1.6.10
  - @graviola/entity-finder@1.4.9
  - @graviola/jsonld-utils@1.5.9
  - @graviola/semantic-jsonform-types@1.4.7
  - @graviola/edb-basic-components@1.4.9

## 1.5.9

### Patch Changes

- fixing wrong package pinning in release pipeline
- Updated dependencies
  - @graviola/edb-linked-data-renderer@5.0.9
  - @graviola/semantic-jsonform-types@1.4.7
  - @graviola/edb-advanced-components@1.6.9
  - @graviola/json-schema-utils@1.5.7
  - @graviola/edb-basic-components@1.4.8
  - @graviola/entity-finder@1.4.8
  - @graviola/jsonld-utils@1.5.8
  - @graviola/edb-state-hooks@1.6.8

## 1.5.8

### Patch Changes

- Updated dependencies
  - @graviola/jsonld-utils@1.5.7
  - @graviola/edb-advanced-components@1.6.8
  - @graviola/edb-state-hooks@1.6.7
  - @graviola/edb-linked-data-renderer@5.0.8
  - @graviola/edb-basic-components@1.4.7
  - @graviola/entity-finder@1.4.7

## 1.5.7

### Patch Changes

- Updated dependencies
  - @graviola/edb-advanced-components@1.6.7
  - @graviola/edb-linked-data-renderer@5.0.7

## 1.5.2

### Patch Changes

- packaging fixes
- Updated dependencies
  - @graviola/edb-linked-data-renderer@5.0.2
  - @graviola/semantic-jsonform-types@1.4.2
  - @graviola/edb-advanced-components@1.6.2
  - @graviola/json-schema-utils@1.5.2
  - @graviola/edb-basic-components@1.4.2
  - @graviola/entity-finder@1.4.2
  - @graviola/jsonld-utils@1.5.2
  - @graviola/edb-state-hooks@1.6.2

## 1.5.1

### Patch Changes

- fixing catalog packaging
- Updated dependencies
  - @graviola/edb-linked-data-renderer@5.0.1
  - @graviola/semantic-jsonform-types@1.4.1
  - @graviola/edb-advanced-components@1.6.1
  - @graviola/json-schema-utils@1.5.1
  - @graviola/edb-basic-components@1.4.1
  - @graviola/entity-finder@1.4.1
  - @graviola/jsonld-utils@1.5.1
  - @graviola/edb-state-hooks@1.6.1

## 1.5.0

### Minor Changes

- typesafe filters and redesigned sparql and graph extraction architecture, bug fixes, api stabilisation, features

### Patch Changes

- Updated dependencies
  - @graviola/edb-linked-data-renderer@5.0.0
  - @graviola/semantic-jsonform-types@1.4.0
  - @graviola/edb-advanced-components@1.6.0
  - @graviola/json-schema-utils@1.5.0
  - @graviola/edb-basic-components@1.4.0
  - @graviola/entity-finder@1.4.0
  - @graviola/jsonld-utils@1.5.0
  - @graviola/edb-state-hooks@1.6.0

## 1.4.0

### Minor Changes

- cleanup , stability, virtuoso support, auth support, inverse queries

### Patch Changes

- Updated dependencies
  - @graviola/edb-linked-data-renderer@4.0.0
  - @graviola/semantic-jsonform-types@1.3.0
  - @graviola/edb-advanced-components@1.5.0
  - @graviola/json-schema-utils@1.4.0
  - @graviola/edb-basic-components@1.3.0
  - @graviola/entity-finder@1.3.0
  - @graviola/jsonld-utils@1.3.0
  - @graviola/edb-state-hooks@1.5.0

## 1.3.0

### Minor Changes

- fix a lot of issues concerning linked data renderer (arrays and objects)

### Patch Changes

- Updated dependencies
  - @graviola/edb-linked-data-renderer@3.0.0
  - @graviola/edb-advanced-components@1.4.0
  - @graviola/edb-state-hooks@1.4.0
  - @graviola/semantic-jsonform-types@1.2.1
  - @graviola/json-schema-utils@1.3.1
  - @graviola/edb-basic-components@1.2.3
  - @graviola/entity-finder@1.2.2
  - @graviola/jsonld-utils@1.2.1

## 1.2.1

### Patch Changes

- Updated dependencies
  - @graviola/edb-basic-components@1.2.1
  - @graviola/edb-advanced-components@1.3.1
  - @graviola/entity-finder@1.2.1
  - @graviola/edb-linked-data-renderer@2.0.1

## 1.2.0

### Minor Changes

- stabelize, streamline query hooks, cleanup

### Patch Changes

- Updated dependencies
  - @graviola/edb-advanced-components@1.3.0
  - @graviola/edb-basic-components@1.2.0
  - @graviola/entity-finder@1.2.0
  - @graviola/edb-linked-data-renderer@2.0.0
  - @graviola/json-schema-utils@1.3.0
  - @graviola/jsonld-utils@1.2.0
  - @graviola/semantic-jsonform-types@1.2.0
  - @graviola/edb-state-hooks@1.3.0

## 1.1.3

### Patch Changes

- Updated dependencies
  - @graviola/edb-advanced-components@1.2.0
  - @graviola/edb-linked-data-renderer@1.1.6
  - @graviola/edb-state-hooks@1.2.5
  - @graviola/entity-finder@1.1.5
  - @graviola/semantic-jsonform-types@1.1.4
  - @graviola/edb-basic-components@1.1.8

## 1.1.2

### Patch Changes

- make workspace depenedncies peer depenedncies
- Updated dependencies
  - @graviola/edb-linked-data-renderer@1.1.5
  - @graviola/semantic-jsonform-types@1.1.4
  - @graviola/edb-advanced-components@1.1.11
  - @graviola/json-schema-utils@1.2.4
  - @graviola/edb-basic-components@1.1.7
  - @graviola/entity-finder@1.1.4
  - @graviola/edb-state-hooks@1.2.4

## 1.1.1

### Patch Changes

- better linked data handling
- Updated dependencies
  - @graviola/edb-linked-data-renderer@1.1.4
  - @graviola/semantic-jsonform-types@1.1.3
  - @graviola/edb-advanced-components@1.1.10
  - @graviola/json-schema-utils@1.2.3
  - @graviola/edb-basic-components@1.1.6
  - @graviola/entity-finder@1.1.3
  - @graviola/edb-state-hooks@1.2.3

## 1.1.0

### Minor Changes

- cleaned up interfaces and simplified initialization of provider and initial setup

### Patch Changes

- Updated dependencies
  - @graviola/edb-linked-data-renderer@1.1.3
  - @graviola/semantic-jsonform-types@1.1.2
  - @graviola/edb-advanced-components@1.1.9
  - @graviola/json-schema-utils@1.2.2
  - @graviola/edb-basic-components@1.1.5
  - @graviola/entity-finder@1.1.2
  - @graviola/edb-state-hooks@1.2.2
