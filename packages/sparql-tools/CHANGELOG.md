# @graviola/sparql-tools

## 0.2.2

### Patch Changes

- 34ce6b4: Integration test is opt-in via SPARQL_TOOLS_TEST_ENDPOINT; unit tests and README.

## 0.2.1

### Patch Changes

- 7c6208f: Security: IRIs are validated before they are placed into SPARQL queries and updates, and the REST server rejects invalid entity IRIs with `400 invalid_entity_iri`. `@graviola/edb-core-utils` adds `isSafeIri`, `assertSafeIri` and `InvalidIriError`; `@graviola/sparql-schema` adds `iriRef`, `sparqlStringLiteral` (full escaping) and `toSparqlVariableName` (replacing three local copies).
- Updated dependencies [e46e114]
- Updated dependencies [7c6208f]
  - @graviola/edb-core-utils@1.7.0

## 0.2.0

### Minor Changes

- 0c6b37a: Port experiments import infrastructure: StagedChangeSet, REST store server, SPARQL dump/load tools, context registry, query-cache scoping, import review components, edb-api reference app, and Tier A bug fixes.
