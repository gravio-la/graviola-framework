---
"@graviola/edb-graph-traversal": patch
"@graviola/sparql-schema": patch
"@graviola/sparql-db-impl": patch
"@graviola/edb-state-hooks": patch
---

**Migration:** `filterOne` / `loadDocumentAsync` no longer include named-entity relations unless you pass `include` (Prisma-like default). Apps that load and write back whole entities must pass explicit `include` for each relation, or set `defaultFilterOptions.includeRelationsByDefault: true` on the SPARQL store provider. Legacy `loadOne` still defaults to including relations.
