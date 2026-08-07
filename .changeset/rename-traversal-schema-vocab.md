---
"@graviola/edb-graph-traversal": minor
"@graviola/sparql-schema": minor
"@graviola/edb-import-staging": patch
---

Rename schema-prep APIs away from the "normalize" misnomer: dereference + project → traversal schema.

- `@graviola/edb-graph-traversal`: `normalizeSchema` → `buildTraversalSchema`, `NormalizedSchema` → `TraversalSchema` (`_traversalSchema`), `resolveAllRefs` → `dereferenceSchema`, `applyFilters` → `projectSchema`; module path `normalizer/` → `traversal-schema/`. Reserve "normalize"/"canonicalize" for true normal-form transforms (e.g. `canonicalizeSchemaForFingerprint`).
- `@graviola/sparql-schema`: `normalizedSchema2construct` → `traversalSchema2construct`.
- `@graviola/edb-import-staging`: `normalizeStagedDocument` → `prepareStagedDocument`.

**Breaking:** no legacy aliases — update imports and call sites to the new names.
