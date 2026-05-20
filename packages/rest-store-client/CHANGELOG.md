# @graviola/rest-store-client

## 0.3.0

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
  - @graviola/edb-core-types@1.5.0
  - @graviola/store-core@0.3.0
  - @graviola/typed-query-types@0.3.0
  - @graviola/edb-global-types@1.3.7

## 0.2.0

### Minor Changes

- Add `@graviola/rest-store-client`: HTTP `RESTClientStore` (v1 wire), `LegacyRESTClientStore` (v0 URLs), discovery handshake helpers, shared transport utilities, optional AbstractDatastore shim, specs under `spec/`, and generated OpenAPI 3.1. Delegate `@graviola/restfull-fetch-db-impl` through the new client package and wire `@graviola/rest-store-provider` to use `LegacyRESTClientStore` + shim directly.

### Patch Changes

- Implement `RestTransport` with **ky**: HTTP-status retries (replacing the previous `fetch`-only retry helper), optional `retry` options (`RetryOptions` from ky / `defaultRestTransportRetry`), stable `Idempotency-Key` across ky retries for `mutatingJson`. Remove exports `withRetry`, `defaultRetryPolicy`, and `RetryPolicy`; add `defaultRestTransportRetry` and `RestTransportRetryOptions`.
- Updated dependencies
  - @graviola/store-core@0.2.0
  - @graviola/typed-query-types@0.2.0
  - @graviola/edb-core-types@1.4.8
  - @graviola/edb-global-types@1.3.7
