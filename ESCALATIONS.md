# Escalations

Items that need architect / convention sign-off before they become stable API.

## `entityMeta` descriptor profile naming

**Status:** proposed (P1 entity-level metadata)

**Context:** Phase 1 adds an optional `profiles.entityMeta` block on `CapabilityDescriptor`
advertising how a store encodes system-asserted `$meta` (named-graph, triples, column, pipeline).

**Proposal:** use `entityMeta` under `profiles` (mirrors `searches`, `counts`, `writes`).

**Alternatives considered:** `meta`, `entityMetadata`, `profiles.metaStamping`.

**Action:** confirm naming aligns with store registry / federation vocabulary before GA.
