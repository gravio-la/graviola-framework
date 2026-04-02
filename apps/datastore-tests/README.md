# datastore-tests

Integration and contract tests for [`AbstractDatastore`](../../packages/edb-global-types) implementations used across the Graviola stack. The same suites run against every **active** backend (SPARQL stores, Prisma-backed SQL, etc.) so behavior stays aligned.

## Purpose

- Exercise CRUD, query, optional count/flat-result-set/import/class/iterable/label suites from `src/suites/`.
- Regenerate Prisma schema per database URL when a Prisma adapter runs (`scripts/setupPrismaCore.ts`), so one app can target SQLite, PostgreSQL, MariaDB, or (in future) other Prisma providers without a global one-off setup.

Runtime: **Bun** (`bun test`). Adapters are chosen from environment variables before tests collect (see `src/adapters/index.ts`).

## Prerequisites

- From the monorepo root: `bun install` (workspace installs dependencies).
- Optional Docker services for remote SPARQL/SQL databases: from **this directory**, `bun run docker:up` (or `docker compose up -d --wait`).

## Environment variables

| Variable               | Effect                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SKIP_DEFAULT_ADAPTER` | If set to a truthy value (`1`, `true`, `yes`), omits the default **in-process Oxigraph** and default **Prisma/SQLite** unless you opt in explicitly (see below).                                                                                                                                                                                        |
| `SKIP_PRISMA`          | If set, omits **all** Prisma adapters (SQLite, PostgreSQL, MariaDB, MongoDB).                                                                                                                                                                                                                                                                           |
| `SQLITE_URL`           | Prisma/SQLite URL (e.g. `file:./prisma/test.db`). With `SKIP_DEFAULT_ADAPTER=1`, SQLite Prisma runs only if this is set.                                                                                                                                                                                                                                |
| `POSTGRES_URL`         | Enables **Prisma/PostgreSQL** (e.g. `postgresql://test:test@localhost:5432/graviola_test`).                                                                                                                                                                                                                                                             |
| `MARIADB_URL`          | Enables **Prisma/MariaDB** (e.g. `mysql://test:test@localhost:3307/graviola_test`).                                                                                                                                                                                                                                                                     |
| `MONGODB_URL`          | Would enable **Prisma/MongoDB**, but **this suite uses Prisma ORM 7.x**, which **does not support MongoDB** yet. Prisma’s documentation directs MongoDB users to **Prisma 6.x** until support exists. Setting `MONGODB_URL` causes setup to fail with a clear error; the `mongodb` service in `docker-compose.yml` is kept for manual experiments only. |
| `OXIGRAPH_URL`         | SPARQL over HTTP against Oxigraph (e.g. `http://localhost:7878`).                                                                                                                                                                                                                                                                                       |
| `BLAZEGRAPH_URL`       | SPARQL over HTTP against Blazegraph (e.g. `http://localhost:9999/bigdata`).                                                                                                                                                                                                                                                                             |

`DATABASE_URL` is set internally by Prisma setup from the adapter URL; you normally do not set it yourself for tests.

## Scripts (`package.json`)

| Script                                      | Description                                                                                                                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run test`                              | Run the contract test file (`src/datastore.test.ts`).                                                                                                                  |
| `bun run test:mongo`                        | Runs tests with `SKIP_DEFAULT_ADAPTER=1` and a sample `MONGODB_URL`. **Expected to fail** until MongoDB is supported on Prisma 7 or a separate Prisma 6 path is added. |
| `bun run docker:up` / `bun run docker:down` | Start/stop Compose services in this directory.                                                                                                                         |
| `bun run setup:prisma`                      | Optional standalone Prisma schema generation (see `scripts/setup-prisma.ts`).                                                                                          |

## Typical commands

Default local run (in-process Oxigraph + Prisma/SQLite):

```bash
cd apps/datastore-tests
bun test
```

Only MariaDB Prisma (after `docker compose up` for `mariadb`):

```bash
SKIP_DEFAULT_ADAPTER=1 MARIADB_URL='mysql://test:test@localhost:3307/graviola_test' bun test
```

Docker URLs for this repo’s `docker-compose.yml` are summarized at the top of that file.

## MongoDB and Prisma 7

Prisma documents that **MongoDB is not supported on Prisma ORM 7**; use the latest **6.x** release for MongoDB until support is added. This package depends on Prisma 7 for SQL adapters, so **do not expect `MONGODB_URL` or `test:mongo` to succeed** until the project introduces a supported approach (e.g. an isolated Prisma 6 toolchain for MongoDB only).

## Layout

- `src/datastore.test.ts` — entry point; loops adapters and attaches suites.
- `src/adapters/` — Oxigraph, SPARQL HTTP, Prisma.
- `src/suites/` — shared test suites.
- `src/schema/testSchema.ts` — JSON Schema used for Prisma generation and stores.
- `scripts/setupPrismaCore.ts` — writes `prisma/schema.prisma`, runs `prisma generate` and `db push` for the active URL.
