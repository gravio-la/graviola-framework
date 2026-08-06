# Escalations

Items that need architect / convention sign-off before they become stable API.

## `entityMeta` descriptor profile naming

**Status:** proposed (P1 entity-level metadata)

**Context:** Phase 1 adds an optional `profiles.entityMeta` block on `CapabilityDescriptor`
advertising how a store encodes system-asserted `$meta` (named-graph, triples, column, pipeline).

**Proposal:** use `entityMeta` under `profiles` (mirrors `searches`, `counts`, `writes`).

**Alternatives considered:** `meta`, `entityMetadata`, `profiles.metaStamping`.

**Action:** confirm naming aligns with store registry / federation vocabulary before GA.

**Update (P1 lifecycle extension):** `profiles.entityMeta` now includes an optional
`lifecycleTimestamps` sub-key: `false` | `"application"` | `"database-native"`.
Prisma SQL stores default to `"database-native"` when meta stamping is enabled; SPARQL
downgrades `"database-native"` to `"application"` in the descriptor (no DB primitives).
Deployment-specific audit fields (editor, agent) remain application MetaSchema extensions,
not part of this sub-key.

## `statementMeta` descriptor profile + `statements` facet naming

**Status:** proposed (P3 fact-level metadata)

**Context:** Phase 3 adds an optional `profiles.statementMeta` block on
`CapabilityDescriptor` advertising how a store encodes fact-level statement metadata
(`statement-node`, `rdf-12`, `side-table`, `named-graph`, `none`), plus a
`statements` capability facet with `writeStatements` / `loadStatements`.

**Proposal:** use `statementMeta` under `profiles` (mirrors `entityMeta`) and
`statements` as the capability name.

**Alternatives considered:** `factMeta`, `provenance` (rejected: collides with
`ReadResult.provenance` envelope), `stmt`.

**Action:** confirm naming aligns with store registry / federation vocabulary before GA.
