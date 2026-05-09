# @graviola/rest-store-client

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
