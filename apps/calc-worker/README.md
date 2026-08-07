# calc-worker

Reference calc-tier deployment: the garden-fee domain schema (`@graviola/calc-fixtures`)
exposed over the Graviola REST v1 wire protocol, with server-side materialization
via `@graviola/calc-worker` (cold-start warm sweep + live invalidation subscription).

```bash
bun run start
```

- REST base: `http://localhost:4030/api/graviola`
- Handshake: `http://localhost:4030/.well-known/graviola-store` — advertises
  `calc.supported: true` and `statements: true` per type.
- `PUT /{typeName}/{id}` — upsert `Plot` / `Patch` / `Garden` (see
  `@graviola/calc-fixtures`'s `gardenFeeSchema` for shape).
- `POST /{typeName}/{id}/_statements/query` — read materialized `$stmt` values
  (`{ "paths"?: string[] }` body; omit `paths` for every annotated path).
- `POST /_calc/warm` — trigger an on-demand warm sweep
  (`{ "rootIRIs"?: string[], "skipFresh"?: boolean }` body).

## Backend

Backend is env-driven via `@graviola/store-factory` (`GRAVIOLA_STORE`, default
`oxigraph` — in-process, no external service, state is not persisted across
restarts). `GRAVIOLA_STORE=prisma` + `DATABASE_URL` is the documented reference
deployment (Prisma+Postgres) — this app does not ship its own Prisma migration
for the garden-fee schema; point it at a database already migrated for that
shape (see `@graviola/json-schema-prisma-utils`).
