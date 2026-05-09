# Graviola REST wire contract — version 1

Normative HTTP mapping for the logical [`Store<R>`](../../store-core) surface. Routes are **relative** to `basePath` advertised in the [handshake](./graviola-rest-handshake.md).

## Resource layout

Type-scoped paths (no `/entities` prefix):

| Pattern               | Purpose               |
| --------------------- | --------------------- |
| `/{typeName}/{id}`    | Single entity         |
| `/{typeName}`         | Type-level list       |
| `/{typeName}/_query`  | Typed filter (`POST`) |
| `/{typeName}/_count`  | Count (`POST`)        |
| `/{typeName}/_search` | Text search (`POST`)  |

Underscore-prefixed segments are **operations**, avoiding collisions with arbitrary type names.

## IRI-in-path modes

Configured on the client; server advertises supported modes in handshake.

| Mode                | `{id}` segment                                                   |
| ------------------- | ---------------------------------------------------------------- |
| `fullIRI` (default) | Full IRI, URL-encoded (`encodeURIComponent`)                     |
| `localId`           | Opaque local key; server maps `(typeName, localId)` → entity IRI |

Mismatch MUST surface as handshake/config failure, not silent wrong entity.

## Operations

| Store intent                      | HTTP     | Route                                                             |
| --------------------------------- | -------- | ----------------------------------------------------------------- |
| `loadOne`                         | `GET`    | `/{typeName}/{id}` — `404` + `entity_not_found` when missing      |
| `exists`                          | `HEAD`   | `/{typeName}/{id}` — `200` / `404`                                |
| `upsert`                          | `PUT`    | `/{typeName}/{id}` — JSON body = entity document                  |
| `remove`                          | `DELETE` | `/{typeName}/{id}`                                                |
| `list`                            | `GET`    | `/{typeName}?limit=&offset=&cursor=`                              |
| `filterMany` / `filterOne`        | `POST`   | `/{typeName}/_query` — body below                                 |
| `count`                           | `POST`   | `/{typeName}/_count` — body `{ "where": … }`                      |
| `searchByLabel` / text row search | `POST`   | `/{typeName}/_search` — body below                                |
| `loadOne` + envelope              | `GET`    | Same URL — `Accept: application/vnd.graviola-store.envelope+json` |

### `_query` body

JSON object (conceptually aligned with typed filter options):

```json
{
  "where": {},
  "include": {},
  "select": {},
  "omit": {},
  "pagination": {},
  "searchString": null,
  "walkerOptions": {},
  "maxRecursion": 4
}
```

Servers SHOULD ignore unknown keys.

### `_search` body

```json
{
  "text": "needle",
  "fields": ["label"],
  "restrictTo": {},
  "limit": 50
}
```

### Optional: `resolveTypes`

When handshake advertises `resolves.supported`:

| Store intent   | HTTP                                                        |
| -------------- | ----------------------------------------------------------- |
| `resolveTypes` | `GET /_resolve-types?entityIRI=` — JSON array of class IRIs |

Global path under `basePath` (not type-scoped).

## Pagination

Query parameters on `GET /{typeName}` (and optionally echoed in `_query` pagination object):

- `limit` — required semantics for bounded reads
- `offset` — offset mode
- `cursor` — opaque; mutually exclusive with `offset`

Response envelope for list-style endpoints:

```json
{
  "items": [],
  "pagination": {
    "total": 1234,
    "limit": 50,
    "offset": 100,
    "next": "opaque-cursor",
    "hasMore": true
  }
}
```

`total` MAY be `null` when unknown (common with cursor mode).

## Idempotency

Clients SHOULD send `Idempotency-Key` (UUID) on `PUT`, `POST`, `DELETE` where replay matters.

- Same key + equivalent payload → same successful response (within server window).
- Same key + differing payload → `409` + `code: idempotency_conflict`.

## Error envelope

RFC 7807 Problem Details with mandatory stable **`code`**:

```json
{
  "type": "https://example.com/errors/entity-not-found",
  "title": "Entity not found",
  "status": 404,
  "code": "entity_not_found",
  "detail": "…",
  "instance": "…"
}
```

Clients MUST branch on `code`, not `title`.

Recommended codes: `entity_not_found`, `validation_failed`, `capability_not_supported`, `auth_required`, `forbidden`, `limit_exceeded`, `idempotency_conflict`.

## Streaming

**Not in v1.** HTTP-backed Stores MUST NOT advertise Store `streams` until a future NDJSON/SSE contract exists.

## Aggregates / facets / remote change events

Out of scope for v1; reserved for later federation work.
