# `@graviola/calc-engine`

Batched calc evaluation driver: **plan → precise read → evaluate → optional materialize**.

## API

- `evaluateForRoots(store, profile, typeName, schema, opts)` — one `filterMany` per batch, shared HyperFormula engine, asserted `queriesIssued`
- `warm(store, profile, typeName, schema, opts)` — resumable materialization with `inputFingerprint`
- `subscribeCalcInvalidation(...)` — change-bus subscriber + reverse-dependents IVM
- `tryPushdownAggregates(...)` — Stage 5 seam (falls back when store cannot push down)

See the production-path plan and `ESCALATIONS.md` for architectural decisions.
