---
"@graviola/json-schema-utils": minor
"@graviola/graviola-app-config": minor
"@graviola/edb-ui-utils": patch
"@graviola/edb-advanced-components": patch
"@graviola/edb-linked-data-renderer": patch
---

Relation pickers can restrict candidate entities via `linkFilters` on the Graviola side-schema (or per-control `options.linkFilter`). Filters use Prisma-style `where` clauses with `{ "$data": "binding.path" }` resolved from the root form at runtime.
