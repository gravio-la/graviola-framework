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

## Anonymous statement nodes in SPARQL v1 (skolem IRIs deferred)

**Status:** proposed (P3 slice 1)

**Context:** statement-node encoding uses anonymous blank nodes in the entity CBD.
Stable, addressable statement IRIs (`<entity>#…/stmt/…`) would require a fragment-IRI
exemption in `shouldHaltAtNamedEntityBoundary` during graph extraction.

**Action:** architect sign-off before promoting skolem statement IRIs from escalation to implementation.

## Feature-on loads embed `$stmt` for `always` properties (statement-node)

**Status:** deviation documented (P3 slice 1)

**Context:** the concept primer described per-read `include` opt-in for `$stmt`.
statement-node encoding embeds annotated paths on `loadOne` / `loadDocument` when
`statementMeta` is enabled, instead of requiring an explicit include flag.

**Action:** per-read include + typed `$stmt` filters planned for the next slice.

## MongoDB side-table deferred

**Status:** escalated (P3 slice 1)

**Context:** Prisma MongoDB provider has id / `@map("_id")` quirks; `statementMeta`
side-table encoding throws at store init on MongoDB in this slice.

**Action:** revisit when Prisma Mongo path stabilizes or a document-embedded encoding is specified.

## Statement values restricted to primitives

**Status:** slice cut (P3 slice 1)

**Context:** `StatementValue` is `string | number | boolean` only.
Object-valued properties and array-valued annotated paths are deferred.

**Action:** extend StatementSchema + encodings when a concrete use case lands.

## `writeStatements` uses full-document truthy write

**Status:** performance note (P3 slice 1)

**Context:** dual assertion reloads the entity document and upserts truthy fields
after statement rows/triples are written. Per-slot patch writes are deferred.

**Action:** optimize when statement-heavy workloads appear in production traces.

## Local browser Oxigraph WASM (0.4.x) — statement-node only

**Status:** known limitation

**Context:** `@graviola/local-oxigraph-store-provider` ships Oxigraph 0.4.x WASM.
RDF 1.2 / `rdf-12` reifier encoding requires Oxigraph ≥ 0.5.

**Action:** upgrade WASM bundle in a dedicated release; until then local-first browsers use `statement-node`.

## RDF 1.2 spike notes (Oxigraph 0.5.6)

**Status:** resolved in slice 1

**Context:** explicit reifier + `rdf:reifies <<( s p o )>>` with STMT addressing
predicates round-trips via `packages/sparql-db-impl/src/rdf12Statements.ts`.
Annotation sugar forms were not needed for the facet API.

**Action:** none — encoding shipped as `rdf-12` profile value.

## Calc materialization: fingerprint cached view vs pure derivation

**Status:** decided for `@graviola/calc-engine` warm path (glossary 4.8)

**Context:** Production computed values persist via `writeStatements` with
`wasGeneratedBy.inputFingerprint`. Reads prefer materialized values; freshness
is `isMaterializationFresh`. Pure derivation remains available via
`evaluateForRoots` for live overlays.

**Proposal:** cached materialized view with fingerprint freshness is the default
server path; browsers may live-evaluate cost-gated slots (`selectLiveEvalSlots`).

**Action:** confirm before GA; document in conceptual calculated-fields chapter.

## Entity-level change bus as calc invalidation substrate

**Status:** proposed (calc-engine Stage 4)

**Context:** `store.subscribe` emits entity-level upsert/remove events. Slot-level
diffs require either `event.data` or a load of prior fingerprints. Without either,
`dirtyScopesForChange` treats all slots on the changed type (+ transitive
dependents) as dirty.

**Proposal:** keep entity-level events; document the coarse-dirty fallback; refine
to slot-level when writes always carry `data` or statements are loadable cheaply.

**Action:** architect sign-off on coarse fallback vs requiring `data` on upserts.

## `@graviola/calc-engine` package boundary

**Status:** decided

**Context:** Driver for plan → batched read → evaluate → warm / delta lives in a
new package rather than folding into `formula-materialization` (which stays a pure
plan/write helper with no store orchestration).

**Action:** none — package shipped as Layer 2.

## JSON-LD `filterMany` lacks server-side pagination

**Status:** escalated (known; deferred honest fix)

**Context:** `StoreDocumentsSearchOptions` gained `entityIRIs` but still has no
`pagination`. SPARQL `filterTypedDocuments` CONSTRUCT has no LIMIT; callers may
cap post-fetch via `limit`. Selection-depth honouring landed; paged subject
subselects remain a follow-up.

**Action:** implement paged subject subselect inside CONSTRUCT when list UIs need
thousands of JSON-LD rows.

## Query-scoped aggregates (level 4) deferred

**Status:** deferred

**Context:** `CalcAggregate.over` is an in-document collection path only.
`where` inside aggregate / relation-query bindings are level 4 in the conceptual
defaults ladder. `planCalcReads` reports unreachable slots instead of inventing
query-scoped aggregates. Stage 5 `tryPushdownAggregates` is a capability-flagged
seam (`canPushdownAggregates` + optional `evaluateAggregate`) with
`computeAggregateInJs` / `assertPushdownEqualsJs` as the differential oracle;
without a native evaluator it always falls back to JS (`pushed: false`).

**Action:** admit only with a concrete use case the intermediate-slot idiom cannot express.
