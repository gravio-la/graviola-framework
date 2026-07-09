# P3–P5 follow-up plan (post P0–P2)

Produced after milestone gate CP2. **Do not implement until CP2 is approved.**

## P3 — Fact-level provenance (`$stmt`)

- `deriveProvenanceSchema` in `@graviola/meta-schema` or dedicated package
- Descriptor `profiles.provenance.statementLevel` encoding negotiation
- Per-flavour SPARQL emission (statement-node, rdf-star, side-table)
- Write policy `always | on-conflict | never`
- Shared suite in `apps/datastore-tests`
- Storybook: DetailRenderer provenance panel

## P4 — Bidirectional slots (puts)

- Sidecar slot `put` block; compiler stratum-0 target check
- Round-trip law property tests
- `x-inverseOf` parity suite
- Concept book: lenses unification chapter

## P5 — Version lenses (minimal)

- `@graviola/lens-core`: rename, move, add-default, remove-with-tombstone
- Read pipeline consults `$meta.schemaVersion` + lens registry
- Mixed-version dataset tests
- **ESCALATE:** failure mode when no lens registered for version mismatch

## Open escalations (see `ESCALATIONS.md`)

1. Descriptor naming for provenance/meta blocks — `entityMeta` proposed for P1
2. Cross-CBD puts policy — document restriction in P4
3. Version-mismatch failure mode — P5
