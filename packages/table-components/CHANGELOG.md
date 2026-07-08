# @graviola/edb-table-components

## 2.0.3

### Patch Changes

- Updated dependencies [184c8e9]
- Updated dependencies [0c6b37a]
  - @graviola/edb-core-types@1.7.0
  - @graviola/edb-detail-renderer-core@0.5.0
  - @graviola/edb-detail-renderer@0.6.0
  - @graviola/edb-state-hooks@1.8.0
  - @graviola/edb-core-utils@1.6.1
  - @graviola/store-core@0.3.3
  - @graviola/edb-table-renderer-sparql-select@0.1.6
  - @graviola/edb-table-renderer-jsonld@0.2.3
  - @graviola/edb-basic-components@1.5.5
  - @graviola/json-schema-utils@1.7.2
  - @graviola/edb-ui-utils@0.4.4

## 2.0.2

### Patch Changes

- Updated dependencies
  - @graviola/edb-core-types@1.6.0
  - @graviola/edb-core-utils@1.6.0
  - @graviola/edb-detail-renderer@0.5.2
  - @graviola/edb-detail-renderer-core@0.4.2
  - @graviola/edb-state-hooks@1.7.4
  - @graviola/store-core@0.3.2
  - @graviola/edb-table-renderer-sparql-select@0.1.5
  - @graviola/json-schema-utils@1.7.1
  - @graviola/edb-table-renderer-jsonld@0.2.2
  - @graviola/edb-ui-utils@0.4.3
  - @graviola/edb-basic-components@1.5.4

## 2.0.1

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.7.0
  - @graviola/edb-detail-renderer@0.5.1
  - @graviola/edb-detail-renderer-core@0.4.1
  - @graviola/edb-state-hooks@1.7.3
  - @graviola/edb-table-renderer-jsonld@0.2.1
  - @graviola/edb-table-renderer-sparql-select@0.1.4
  - @graviola/edb-ui-utils@0.4.2
  - @graviola/edb-basic-components@1.5.3

## 2.0.0

### Minor Changes

- 3fdd17b: Image parity for the JSON-LD table row shape. New `ImageValueRenderer` (selected structurally via `format: "uri"` + `contentMediaType: "image/*"`, or explicitly via `valueRenderer: "image"`) with `imageUriTester` in detail-renderer-core. The jsonld column registry gains a primary-column entry (`jsonld:primary`): the property declared as `primaryFields[typeName].label` now renders avatar + clickable label (opens the detail view), mirroring the sparql-select row shape. `TableTesterContext` carries an optional `primaryField` declaration and `SemanticTable` forwards it; jsonld primary column ordering fixed.

### Patch Changes

- Updated dependencies [3fdd17b]
  - @graviola/edb-detail-renderer-core@0.4.0
  - @graviola/edb-detail-renderer@0.5.0
  - @graviola/edb-table-types@0.2.0
  - @graviola/edb-table-renderer-jsonld@0.2.0
  - @graviola/edb-state-hooks@1.7.2
  - @graviola/edb-table-mrt-adapter@0.1.2
  - @graviola/edb-table-renderer-sparql-select@0.1.3
  - @graviola/edb-basic-components@1.5.2

## 1.5.1

### Patch Changes

- fix version pinning issues
- Updated dependencies
  - @graviola/edb-basic-components@1.5.1
  - @graviola/edb-core-types@1.5.1
  - @graviola/edb-core-utils@1.5.8
  - @graviola/json-schema-utils@1.6.1
  - @graviola/edb-state-hooks@1.7.1
  - @graviola/store-core@0.3.1
  - @graviola/edb-table-mrt-adapter@0.1.1
  - @graviola/edb-table-renderer-jsonld@0.1.2
  - @graviola/edb-table-renderer-sparql-select@0.1.2
  - @graviola/edb-table-types@0.1.1
  - @graviola/edb-ui-utils@0.4.1

## 1.5.0

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
  - @graviola/edb-basic-components@1.5.0
  - @graviola/edb-core-types@1.5.0
  - @graviola/edb-state-hooks@1.7.0
  - @graviola/edb-ui-utils@0.4.0
  - @graviola/json-schema-utils@1.6.0
  - @graviola/store-core@0.3.0
  - @graviola/edb-table-renderer-sparql-select@0.1.1
  - @graviola/edb-core-utils@1.5.7
  - @graviola/edb-table-renderer-jsonld@0.1.1

## 1.4.10

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @graviola/json-schema-utils@1.5.8
  - @graviola/edb-core-types@1.4.8
  - @graviola/sparql-schema@1.5.10
  - @graviola/edb-state-hooks@1.6.9
  - @graviola/edb-ui-utils@0.3.8
  - @graviola/edb-core-utils@1.5.7
  - @graviola/edb-data-mapping@0.3.8
  - @graviola/edb-basic-components@1.4.9

## 1.4.9

### Patch Changes

- fixing wrong package pinning in release pipeline
- Updated dependencies
  - @graviola/json-schema-utils@1.5.7
  - @graviola/edb-basic-components@1.4.8
  - @graviola/sparql-schema@1.5.9
  - @graviola/edb-data-mapping@0.3.7
  - @graviola/edb-state-hooks@1.6.8
  - @graviola/edb-core-types@1.4.7
  - @graviola/edb-core-utils@1.5.7
  - @graviola/edb-ui-utils@0.3.7

## 1.4.8

### Patch Changes

- Updated dependencies
  - @graviola/sparql-schema@1.5.8

## 1.4.7

### Patch Changes

- @graviola/sparql-schema@1.5.7
- @graviola/edb-state-hooks@1.6.7
- @graviola/edb-basic-components@1.4.7

## 1.4.2

### Patch Changes

- packaging fixes
- Updated dependencies
  - @graviola/json-schema-utils@1.5.2
  - @graviola/edb-basic-components@1.4.2
  - @graviola/sparql-schema@1.5.2
  - @graviola/edb-data-mapping@0.3.2
  - @graviola/edb-state-hooks@1.6.2
  - @graviola/edb-core-types@1.4.2
  - @graviola/edb-core-utils@1.5.2
  - @graviola/edb-ui-utils@0.3.2

## 1.4.1

### Patch Changes

- fixing catalog packaging
- Updated dependencies
  - @graviola/json-schema-utils@1.5.1
  - @graviola/edb-basic-components@1.4.1
  - @graviola/sparql-schema@1.5.1
  - @graviola/edb-data-mapping@0.3.1
  - @graviola/edb-state-hooks@1.6.1
  - @graviola/edb-core-types@1.4.1
  - @graviola/edb-core-utils@1.5.1
  - @graviola/edb-ui-utils@0.3.1

## 1.4.0

### Minor Changes

- typesafe filters and redesigned sparql and graph extraction architecture, bug fixes, api stabilisation, features

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.5.0
  - @graviola/edb-basic-components@1.4.0
  - @graviola/sparql-schema@1.5.0
  - @graviola/edb-data-mapping@0.3.0
  - @graviola/edb-state-hooks@1.6.0
  - @graviola/edb-core-types@1.4.0
  - @graviola/edb-core-utils@1.5.0
  - @graviola/edb-ui-utils@0.3.0

## 1.3.0

### Minor Changes

- cleanup , stability, virtuoso support, auth support, inverse queries

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.4.0
  - @graviola/edb-basic-components@1.3.0
  - @graviola/sparql-schema@1.4.0
  - @graviola/edb-state-hooks@1.5.0
  - @graviola/edb-core-types@1.3.0
  - @graviola/edb-core-utils@1.4.0
  - @graviola/edb-data-mapping@0.2.7

## 1.2.2

### Patch Changes

- fix a lot of issues concerning linked data renderer (arrays and objects)
- Updated dependencies
  - @graviola/edb-state-hooks@1.4.0
  - @graviola/json-schema-utils@1.3.1
  - @graviola/edb-basic-components@1.2.3
  - @graviola/sparql-schema@1.3.1

## 1.2.1

### Patch Changes

- Updated dependencies
  - @graviola/edb-basic-components@1.2.1

## 1.2.0

### Minor Changes

- stabelize, streamline query hooks, cleanup

### Patch Changes

- Updated dependencies
  - @graviola/edb-basic-components@1.2.0
  - @graviola/edb-core-types@1.2.0
  - @graviola/edb-core-utils@1.4.0
  - @graviola/json-schema-utils@1.3.0
  - @graviola/sparql-schema@1.3.0
  - @graviola/edb-state-hooks@1.3.0
  - @graviola/edb-ui-utils@0.2.6
  - @graviola/edb-data-mapping@0.2.6

## 1.1.5

### Patch Changes

- Updated dependencies
  - @graviola/edb-core-utils@1.3.0
  - @graviola/edb-core-types@1.1.3
  - @graviola/edb-data-mapping@0.2.5
  - @graviola/sparql-schema@1.2.6
  - @graviola/edb-state-hooks@1.2.5
  - @graviola/edb-ui-utils@0.2.5
  - @graviola/edb-basic-components@1.1.8

## 1.1.4

### Patch Changes

- make workspace depenedncies peer depenedncies
- Updated dependencies
  - @graviola/json-schema-utils@1.2.4
  - @graviola/edb-basic-components@1.1.7
  - @graviola/sparql-schema@1.2.5
  - @graviola/edb-data-mapping@0.2.4
  - @graviola/edb-state-hooks@1.2.4
  - @graviola/edb-core-types@1.1.2
  - @graviola/edb-core-utils@1.2.3
  - @graviola/edb-ui-utils@0.2.4

## 1.1.3

### Patch Changes

- better linked data handling
- Updated dependencies
  - @graviola/json-schema-utils@1.2.3
  - @graviola/edb-basic-components@1.1.6
  - @graviola/sparql-schema@1.2.4
  - @graviola/edb-data-mapping@0.2.3
  - @graviola/edb-state-hooks@1.2.3
  - @graviola/edb-ui-utils@0.2.3

## 1.1.2

### Patch Changes

- cleaned up interfaces and simplified initialization of provider and initial setup
- Updated dependencies
  - @graviola/json-schema-utils@1.2.2
  - @graviola/edb-basic-components@1.1.5
  - @graviola/sparql-schema@1.2.3
  - @graviola/edb-data-mapping@0.2.2
  - @graviola/edb-state-hooks@1.2.2
  - @graviola/edb-core-types@1.1.1
  - @graviola/edb-core-utils@1.2.2
  - @graviola/edb-ui-utils@0.2.2

## 1.1.1

### Patch Changes

- updated to react-query version 5 and fixes
- Updated dependencies
  - @graviola/json-schema-utils@1.2.1
  - @graviola/edb-basic-components@1.1.1
  - @graviola/sparql-schema@1.2.2
  - @graviola/edb-data-mapping@0.2.1
  - @graviola/edb-state-hooks@1.2.1
  - @graviola/edb-core-utils@1.2.1
  - @graviola/edb-ui-utils@0.2.1

## 1.1.0

### Minor Changes

- massive refactoring due to separation of dependencies in order to publish the library for universal reuse

### Patch Changes

- Updated dependencies
  - @graviola/json-schema-utils@1.2.0
  - @graviola/edb-basic-components@1.1.0
  - @graviola/sparql-schema@1.2.0
  - @graviola/edb-data-mapping@0.2.0
  - @graviola/edb-state-hooks@1.2.0
  - @graviola/edb-core-utils@1.2.0
  - @graviola/edb-ui-utils@0.2.0
