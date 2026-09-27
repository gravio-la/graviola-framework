---
"@graviola/edb-core-utils": minor
"@graviola/sparql-schema": patch
"@graviola/sparql-tools": patch
"@graviola/rest-store-server": patch
---

Security: IRIs are validated before they are placed into SPARQL queries and updates, and the REST server rejects invalid entity IRIs with `400 invalid_entity_iri`. `@graviola/edb-core-utils` adds `isSafeIri`, `assertSafeIri` and `InvalidIriError`; `@graviola/sparql-schema` adds `iriRef`, `sparqlStringLiteral` (full escaping) and `toSparqlVariableName` (replacing three local copies).
