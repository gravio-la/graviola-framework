# @graviola/edb-import-staging

## 0.3.1

### Patch Changes

- Updated dependencies [34ce6b4]
- Updated dependencies [34ce6b4]
- Updated dependencies [34ce6b4]
  - @graviola/edb-graph-traversal@1.8.0
  - @graviola/data-mapping-hooks@1.3.7

## 0.3.0

### Minor Changes

- 9d7792f: Add canonicalizeChangeSet function for deterministic IRI canonicalization from staging change sets. Extracts local IDs from idAuthority, rewrites temp IRIs, and attaches sameAs. Includes optional coerceLiterals hook for domain-specific literal transformations (e.g., Wikidata string parsing).

### Patch Changes

- 9d7792f: Fix layer violation: import makeDefaultMappingStrategyContext from @graviola/edb-data-mapping instead of @graviola/data-mapping-hooks. The staging context should depend on the mapping engine, not on React hooks.
- 8c5c380: Rename schema-prep APIs away from the "normalize" misnomer: dereference + project → traversal schema.
  - `@graviola/edb-graph-traversal`: `normalizeSchema` → `buildTraversalSchema`, `NormalizedSchema` → `TraversalSchema` (`_traversalSchema`), `resolveAllRefs` → `dereferenceSchema`, `applyFilters` → `projectSchema`; module path `normalizer/` → `traversal-schema/`. Reserve "normalize"/"canonicalize" for true normal-form transforms (e.g. `canonicalizeSchemaForFingerprint`).
  - `@graviola/sparql-schema`: `normalizedSchema2construct` → `traversalSchema2construct`.
  - `@graviola/edb-import-staging`: `normalizeStagedDocument` → `prepareStagedDocument`.

  **Breaking:** no legacy aliases — update imports and call sites to the new names.

- 9d7792f: Add datasetN3 to snapshot() output for full changeSet persistence. The snapshot now includes N-Triples serialization of the RDF dataset alongside entity metadata, enabling complete rehydration via initialState option.
- Updated dependencies [f4f4667]
- Updated dependencies [85bfb6e]
- Updated dependencies [35bd287]
- Updated dependencies [fb7f475]
- Updated dependencies [28b6cad]
- Updated dependencies [8c5c380]
  - @graviola/edb-core-types@1.8.0
  - @graviola/edb-data-mapping@0.5.0
  - @graviola/json-schema-utils@1.8.0
  - @graviola/data-mapping-hooks@1.3.6
  - @graviola/edb-graph-traversal@1.7.0

## 0.2.0

### Minor Changes

- 0c6b37a: Port experiments import infrastructure: StagedChangeSet, REST store server, SPARQL dump/load tools, context registry, query-cache scoping, import review components, edb-api reference app, and Tier A bug fixes.

### Patch Changes

- Updated dependencies [184c8e9]
- Updated dependencies [0c6b37a]
  - @graviola/edb-core-types@1.7.0
  - @graviola/edb-data-mapping@0.4.3
  - @graviola/data-mapping-hooks@1.3.5
  - @graviola/edb-graph-traversal@1.6.4
  - @graviola/json-schema-utils@1.7.2
