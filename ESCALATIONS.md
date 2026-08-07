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

## `dereferenceSchema` cycle-guard conflates sibling `$ref` reuse with real cycles

**Status:** fixed (see below) — no longer escalated

**Context:** `@graviola/graph-traversal`'s `dereferenceSchema` (used by
`buildTraversalSchema`, which every CONSTRUCT-query build depends on) guards
against infinite `$ref` recursion with `context.visitedRefs`, keyed by
`` `${refPath}@${depth}` `` and **mutated on a single `Set` shared across the
entire schema walk** (spread via `{...context}` copies the wrapper, not the
`Set`). This conflates two unrelated situations:

1. **Real structural cycles** (e.g. `Category.subCategories` and
   `Category.parentCategory` both `$ref`-ing `Category`) — where the shared
   mutation is (accidentally) load-bearing: it caps what would otherwise be
   exponential blowup, since both sibling properties recursively contain the
   same two self-referential properties again at every level.
2. **Unrelated sibling properties sharing a value-object `$ref`** at the same
   depth (e.g. two calc-materialized properties on the same type, both
   `$ref`-ing a shared `__Statement` definition via
   `@graviola/statement-meta`'s `deriveProvenanceSchema`) — here the shared
   mutation is a bug: the second sibling's `$ref` gets silently collapsed to
   `{ type: "object", properties: { "@id": { type: "string" } } }`, dropping
   its entire substructure with no error. Confirmed via CONSTRUCT-query dump:
   the first sibling's `$stmt` sidecar got the full `value`/`rank`/`source`/
   `generatedAt`/`wasGeneratedBy` shape; the second got only `rdf:type`.

Two attempted generic fixes both broke existing behavior: (a) branch-local
`Set` clone with the same `(refPath, depth)` key still let case 1 blow up
(each sibling starts its own clone, so both expand fully, independently,
forever); (b) branch-local clone keyed by `refPath` alone (real ancestor-path
cycle detection) fixed case 1 but broke the legitimate multi-level
self-reference test (`schema:knows` → `knows` → `knows`, 3 levels via explicit
`include`), because it stubs the _second_ occurrence of a `$ref` on a path
even when the caller explicitly asked for N levels of self-reference via
`include`. A correct general fix needs to thread the `include`-tree's
requested depth through `dereferenceSchema`, not just a path/depth heuristic.

**Workaround shipped (Stage D):** `initSPARQLStore.ts` now always passes
`inlineStatementSchema: true` to `deriveProvenanceSchema` — this avoids the
shared `$ref` entirely for statement-node sidecars (each annotated property
gets its own inlined copy of the statement schema instead of a shared `$ref`),
which is behavior-preserving for existing single-property configs (the
flattened result is identical either way once `dereferenceSchema` would have
resolved the `$ref` regardless) and fixes the multi-property case. This does
**not** fix the general `dereferenceSchema` bug for other schemas that
legitimately reuse a `$ref` across sibling properties outside the
statement-meta path.

**Fix shipped:** `DereferenceContext` gained an `includeCursor` field, seeded once
(from `filterOptions.include`) at `buildTraversalSchema`'s entry point, narrowed
only when stepping into a named property key (passed through unchanged for
`items`/`allOf`/`anyOf`/`oneOf`, since none of those correspond to an
include-tree key). `visitedRefs` is now genuinely branch-local (cloned, never
mutated in place) and keyed by `refPath` alone (true ancestor-path cycle
detection, not depth-qualified) — this alone fixes case 2 and correctly bounds
case 1 to one real level of self-expansion with zero caller input. On top of
that, a `$ref` reappearing on the path is allowed to expand again — rather than
stub — exactly as many times as the caller's `include` tree, from that point,
still explicitly requests (via `@graviola/typed-query-types`'s existing
`resolveEffectiveMaxRecursion`/`selectionDepth`, reused rather than
reimplemented; default budget `0`, deliberately more conservative than that
helper's own default of `4`, since dereferencing runs unconditionally on every
call including the zero-argument form). Verified: the Category case now bounds
correctly with no configuration, the pre-existing 3-level `schema:knows`
explicit-include test still passes unchanged, and new regression tests cover
both the sibling-collision case (unrelated `$ref`-sharing siblings) and an
explicit-include-overrides-the-default-budget case. Full downstream suites
green (`graph-traversal`, `sparql-schema`, `sparql-db-impl` incl.
`initSPARQLStore.inverseOf.test.ts`, `apps/datastore-tests`), 75/75 packages
build clean. The `inlineStatementSchema: true` workaround in
`initSPARQLStore.ts` is being **kept in place** as defense-in-depth (not
reverted) — it's already behavior-preserving and provides a second, independent
line of defense at the exact call site that hit this bug in production-shaped
data.

**Follow-up, not done here:** `packages/formula-dependency/src/planCalcReads.ts`
has its own independent, parallel cycle guard (`findPathToEntityType`) —
checked directly, it already clones-not-mutates correctly, so it does not
appear to share this bug class. Two smaller things worth a separate audit:
a second, apparently-vestigial `visitedEntityPaths` set (`planCalcReads.ts:244-253`)
with an empty branch body that's never `.add()`-ed anywhere visible (confirm
it's intentionally inert rather than assuming so); and whether two sibling
calc slots that both traverse through the same related entity type correctly
_union_ their required `include`/`select` fields for that type rather than one
clobbering the other (the real analog of this bug for `planCalcReads`'s output,
not covered by cycle-safety alone).

## `$stmt` auto-embed unreliable for entities reached via nested `include`

**Status:** escalated (found during Stage E read-shape verification; worked around by not relying on it, root cause not fixed)

**Context:** The "feature-on loads embed `$stmt`" behavior (see that escalation
above) only holds for an **unfiltered** read of the root: `filterMany("Garden",
{ entityIRIs: [iri] })` with no `select`/`include` correctly returns every
`$stmt` sidecar on Garden's own properties. Two further problems, verified
empirically against a real Oxigraph-backed `statementMeta` store:

1. **`select`/`include` suppresses `$stmt` entirely**, at any depth. Passing
   `planCalcReads`'s selection (a narrow, source-only projection — see
   `@graviola/calc-engine`'s `evaluateForRoots`) returns none of the requested
   type's `$stmt` sidecars, not even at the root. This is arguably correct
   ("you asked for exactly these fields") but means the "no include needed"
   framing in the escalation above only describes the _unfiltered_ case.
2. **Nested entities reached via `include` get incomplete/malformed `$stmt`
   even without a narrowing `select`.** With
   `include: { patch: { include: { plots: {} } } }` (traversal-only, no
   `select` anywhere), Garden's own `$stmt` sidecars were correct, but:
   - `Patch.billable_area_total$stmt` came back with **two duplicate
     entries**, both missing `wasGeneratedBy` entirely (present at the root
     level, absent one level down).
   - `Plot.billable_area$stmt` came back as an **empty array** — the
     sidecar exists (confirmed via direct `loadStatements("Plot", iri)`,
     which returns it correctly) but the nested-`include` extraction drops
     it completely.

**Workaround shipped (Stage E):** `readCalcValues` (`@graviola/calc-engine`)
does not rely on `$stmt` embedding at all — it fetches the raw input tree via
`planCalcReads`'s selection (proven correct for _values_, including
intermediate dual-asserted properties like `Patch.billable_area_total`), then
calls the already-proven-reliable `store.loadStatements` once per entity in
that tree. Costs N+1 queries instead of the hoped-for 1, but every piece is
independently already covered by the Stage D contract suite.

**Action:** root-cause the nested-`include` `$stmt` extraction gap in
`sparql-db-impl`'s graph-traversal/remap path (likely the same family of
issue as the CBD-boundary/dereference work above — worth checking together)
before any caller relies on embedded `$stmt` below the root level.
