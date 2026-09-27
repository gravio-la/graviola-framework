# @graviola/rest-store-server

## 0.3.0

### Minor Changes

- 28c6e10: Type-scoped calc routes (`POST /:type/_calc/warm`, `POST /:type/_calc/values`), typed `Calc` dispatch, `calc.rootTypes` in the handshake; `?materialized=1` only applies to calc root types. `POST /_calc/warm` is deprecated.

### Patch Changes

- 7c6208f: Security: IRIs are validated before they are placed into SPARQL queries and updates, and the REST server rejects invalid entity IRIs with `400 invalid_entity_iri`. `@graviola/edb-core-utils` adds `isSafeIri`, `assertSafeIri` and `InvalidIriError`; `@graviola/sparql-schema` adds `iriRef`, `sparqlStringLiteral` (full escaping) and `toSparqlVariableName` (replacing three local copies).
- Updated dependencies [c449419]
- Updated dependencies [e46e114]
- Updated dependencies [7c6208f]
- Updated dependencies [629d3f5]
- Updated dependencies [cd5f266]
  - @graviola/store-core@0.4.0
  - @graviola/edb-core-utils@1.7.0
  - @graviola/provenance-types@0.2.0

## 0.2.0

### Minor Changes

- 0c6b37a: Port experiments import infrastructure: StagedChangeSet, REST store server, SPARQL dump/load tools, context registry, query-cache scoping, import review components, edb-api reference app, and Tier A bug fixes.

### Patch Changes

- @graviola/store-core@0.3.3
