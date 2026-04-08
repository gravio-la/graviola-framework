# `split/core-framework` branch — removed paths

This branch keeps the Graviola `@graviola/*` library monorepo and generic example apps. Exhibition-specific code lives on `split/manifestations`.

## Deleted top-level paths

- `manifestation/` (entire tree: `exhibition`, `kulinarik`, `exhibition-sparql-config`)
- `apps/exhibition-live/`
- `apps/edb-api/`
- `apps/edb-cli/`

## Kept

- `packages/` (full framework, including `packages/form-renderer/*`, `packages/ideas/*`)
- `apps/testapp`, `apps/storybook`, `apps/datastore-tests`, `apps/json-schema-cli`, `apps/test-prisma-cli`
- `.changeset/`, `_templates/`, `.github/workflows/publish-npm.yml`
- `docker/`, `docker-compose.yml` (nodejs service runs `dev:testapp`)

## Root script changes

- Removed `build:manifestations`, `dev:exhibition`, `dev:vite` (exhibition), `cli` (edb-cli), `prisma:exhibition:*`.
- Added `dev:testapp` and `dev:storybook`.
