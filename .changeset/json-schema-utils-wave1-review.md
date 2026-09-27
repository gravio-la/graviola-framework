---
"@graviola/json-schema-utils": minor
"@graviola/semantic-json-form": patch
---

json-schema-utils: changes since 1.7.2 plus the wave-1 review cleanup.

- New since 1.7.2: `$defs`-aware definition scopes (`definitionScope`, `definitionNameFromScope`, …), `stripXCalcProperties`, content-hash skolem IRIs for anonymous list members, entity identity helpers and configurable CBD boundaries, and a fix for anonymous nested definitions.
- Renamed `getDefintitionKey` → `getDefinitionKey` (no alias). semantic-json-form updated accordingly.
- `resolveSchema` no longer overflows the stack on `$ref` cycles; it returns `undefined` instead.
- Fixed JSON Pointer decoding of multiple `~0` sequences.
- SHA-256 now comes from `@noble/hashes` instead of a hand-written implementation. Hashes are unchanged.
- `@types/json-schema` is now a dependency, because the published types use it. The dependency on `@graviola/edb-core-utils` was dropped.
- Removed unused exports: `filterForArrayProperties`, `filterForPrimitiveProperties`, `filterForPrimitivePropertiesAndArrays`, `removePrimitiveProperties`, `dataAtScopeFromFrame`, `propertyExistsWithinSchema`. Internal helpers are no longer exported: `canonicalMemberJSON`, `defsToDefinitions`, `definitionsToStubDefinitions`, `extendProperties`, `recursivelyFindRefsAndAppendStub`, `filterForPrimitives`, `hasInversePropertyAnnotation`.
