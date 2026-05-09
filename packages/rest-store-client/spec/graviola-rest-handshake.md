# Graviola Store handshake (discovery)

## Purpose

Expose **runtime** facts HTTP cannot infer from OpenAPI alone:

- Wire **version** (`0` vs `1`)
- Effective **base path** and **IRI URL modes**
- **Auth** and **pagination** modes the server expects
- **Per-type** capability truth (read-only vs CRUD, search profile, etc.)

OpenAPI describes routes and schemas; this descriptor describes **honest Store capability routing**.

## Discovery URL

- Configurable by clients (absolute URL or path relative to configured API base).
- **Default path:** `/.well-known/graviola-store`
- Method: `GET`
- Success: `200` with `Content-Type: application/json`

Servers implementing **v0** typically **do not** expose this document; clients fall back to **static configuration** and use `LegacyRESTClientStore`.

## Response envelope

Top-level key **`graviolaStore`** — fixed shape for each protocol version.

### Version `1` — illustrative JSON

```json
{
  "graviolaStore": {
    "version": "1",
    "basePath": "/api/graviola",
    "iriHandling": ["fullIRI", "localId"],
    "auth": {
      "modes": ["bearer", "apiKey", "none"],
      "apiKeyHeader": "X-API-Key"
    },
    "pagination": {
      "modes": ["offset", "cursor"],
      "maxLimit": 1000
    },
    "idempotency": {
      "supported": true,
      "windowSeconds": 86400
    },
    "envelope": {
      "supported": true
    },
    "resolves": {
      "supported": true
    },
    "types": {
      "Plot": {
        "capabilities": {
          "loads": true,
          "lists": true,
          "filters": true,
          "writes": true,
          "removes": true,
          "counts": true,
          "searches": { "mode": "substring", "ranked": false }
        }
      }
    },
    "openapiUrl": "/api/openapi.json"
  }
}
```

### Fields

| Field                 | Meaning                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `version`             | Protocol version string (`"1"` for v1 wire contract)                                      |
| `basePath`            | Prefix for all v1 routes (see wire-v1 doc)                                                |
| `iriHandling`         | Supported IRI-in-path modes: `fullIRI`, `localId`                                         |
| `auth.modes`          | Advertised schemes: `none`, `bearer`, `apiKey`                                            |
| `auth.apiKeyHeader`   | Header name when `apiKey` is used                                                         |
| `pagination.modes`    | `offset` and/or `cursor`                                                                  |
| `pagination.maxLimit` | Upper bound for `limit` query param                                                       |
| `idempotency`         | Whether `Idempotency-Key` de-duplication is honored                                       |
| `envelope`            | Whether `Accept: application/vnd.graviola-store.envelope+json` is supported on GET entity |
| `resolves`            | Whether optional `GET /_resolve-types` (see v1 wire doc) is implemented                   |
| `types`               | Map of logical type name → per-type capability flags                                      |
| `openapiUrl`          | Optional pointer to **generated** OpenAPI document                                        |

Per-type `capabilities` mirrors Store concerns honestly (`loads`, `lists`, `filters`, `writes`, `removes`, `counts`, `searches`).

## Client behaviour

1. If handshake succeeds and `version === "1"` → use `RESTClientStore`.
2. If handshake missing / unreachable → static profile or assume **v0** → use `LegacyRESTClientStore`.
3. On **auth** or **iriHandling** mismatch → fail during handshake (deterministic configuration error).
