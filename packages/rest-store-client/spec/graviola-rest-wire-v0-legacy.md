# Graviola REST wire contract — version 0 (legacy, descriptive)

This document **describes behaviour** implied by the historical `@graviola/restfull-fetch-db-impl` client (`initRestfullStore`). It is **not** a redesign: existing servers are authoritative.

**Normative for client behaviour:** in-repo source [`packages/restfull-fetch-db-impl/src/index.ts`](../../restfull-fetch-db-impl/src/index.ts).

## URL builder

Default pattern:

```
${apiURL}/${operation}/${typeName}${queryString ? `?${queryString}` : ""}
```

Optional trailing slash variants are **not** assumed.

## Operations observed

| Logical use      | operation segment             | HTTP   | Notes                                                                                                       |
| ---------------- | ----------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| Load             | `loadDocument`                | GET    | Query `id=` — IRI processed with decodeURIComponent + `#` → `%23`                                           |
| Exists           | `existsDocument`              | GET    | Response body text `"true"` / `"false"`                                                                     |
| Remove           | `removeDocument`              | DELETE | Query `id=`                                                                                                 |
| Upsert           | `upsertDocument`              | PUT    | JSON body; path **without** trailing id segment                                                             |
| List             | `listDocuments`               | GET    | Uses same machinery as find without search                                                                  |
| Find             | `findDocuments`               | GET    | Query built via `qs`: `search`, `limit`, pagination (`pageIndex`, `pageSize`), `insensitive`, sorting array |
| Count            | `countDocuments`              | GET    | Query string from `qs.stringify(query)` on partial query                                                    |
| Label search     | `findDocumentsByLabel`        | GET    | `label`, `limit`                                                                                            |
| Authority search | `findDocumentsByAuthorityIRI` | GET    | `authorityIRI`, optional `repositoryIRI`, `limit`                                                           |
| Flat rows        | `findDocumentsAsFlat`         | GET    | When exposed server-side                                                                                    |
| Classes          | `classes`                     | GET    | **Empty** `typeName` segment in default builder → `/classes/?id=`                                           |

## Typed filters (`filterTypedDocument`, `filterTypedDocuments`)

These appear on `AbstractDatastore` **implementations** backed by richer stores; the **v0 HTTP contract emitted by `initRestfullStore` does not POST typed filter bodies**. LegacyRESTClientStore therefore treats **rich typed filters as unsupported** on the wire unless a deployment adds non-standard routes (out of scope).

## Errors

Legacy servers vary: JSON bodies, plain text, or HTML. Clients SHOULD tolerate lenient parsing; stable `Problem Details` shape is **v1** territory.

## Capability honesty (`LegacyRESTClientStore`)

Conservative `CapabilityDescriptor`:

- **loads, lists, writes, removes, exists, resolves (via classes), counts, searches (label path)** — when mirrored HTTP ops succeed in deployment testing.
- **filters / typed graph traversal** — effectively **unsupported** over vanilla v0 HTTP as documented here.
- **streams, imports, flatResultSet (Store-shaped)** — **not** exposed on the Store client surface for Phase 4 (flat bindings remain `AbstractDatastore`-only legacy paths via shim if needed).

Deployments extending the URL scheme MUST supply their own handshake/static capability profile when migrating toward v1.
