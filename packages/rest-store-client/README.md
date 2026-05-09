# `@graviola/rest-store-client`

HTTP transports for the logical [`Store<R>`](../store-core) contract:

- **`RESTClientStore`** — v1 REST-shaped wire contract (`spec/graviola-rest-wire-v1.md`).
- **`LegacyRESTClientStore`** — v0 URLs compatible with historical [`initRestfullStore`](../restfull-fetch-db-impl/src/index.ts) deployments.

Shared machinery (`RestTransport`, handshake fetch, RFC7807 parsing, idempotency keys) lives alongside both clients.

`RestTransport` is implemented with [**ky**](https://github.com/sindresorhus/ky): HTTP-aware retries (configurable status codes, backoff cap, `Retry-After`), auth injected in `beforeRequest`, and one auto-generated `Idempotency-Key` per `mutatingJson` call that stays stable across ky’s retries for that logical request. Pass `retry` on `createRestTransport` to tune behavior (defaults in `defaultRestTransportRetry`). Custom `fetchImpl` receives the same inputs as `fetch` (often a `Request` when using ky).

## Shim

`AbstractDatastore` compatibility for existing React providers (exported from the package root for legacy TypeScript `moduleResolution: node`; `./shim` remains available where package exports resolve):

```ts
import {
  LegacyRESTClientStore,
  abstractDatastoreFromRestStore,
} from "@graviola/rest-store-client";

const store = new LegacyRESTClientStore({ apiURL, identifies });
const dataStore = abstractDatastoreFromRestStore(store);
```

## OpenAPI

Generated artifact (not normative): `openapi/graviola-rest-v1.openapi.json` via `bun run generate:openapi`.

## Specs

See [`spec/`](./spec/README.md).
