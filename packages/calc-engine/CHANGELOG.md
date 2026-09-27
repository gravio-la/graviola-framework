# @graviola/calc-engine

## 0.2.0

### Minor Changes

- 8b5b89a: Add `readCalcValuesMany` (batch materialized-first read returning store-core `CalcValuesEntry` reports); `ReadCalcValuesResult` renamed to `ReadCalcValuesReport`; `WarmResult` aliases store-core `CalcWarmResult`.

### Patch Changes

- 8b5b89a: Input fingerprints resolve array paths element-wise and ignore statement sidecars and result order, so re-warms with `skipFresh` and materialized reads recognise fresh values.
- cafe768: Materialization freshness and materialized reads use the latest statement only (`currentStatement` from `@graviola/provenance-types`), so values that change back (A→B→A) are recomputed and reads never serve an older historic value.
- cafe768: Calc freshness checks and warming ignore relation stubs (inverse relations in loaded trees), so materialized values are served as fresh.
- 2a6d699: Server-side calc warming now uses `SERVER_CALC_HOST` by default, so `eval: "server"` and high-cost slots are materialized.
- Updated dependencies [c449419]
- Updated dependencies [cafe768]
- Updated dependencies [35bd287]
- Updated dependencies [629d3f5]
- Updated dependencies [cd5f266]
- Updated dependencies [ae0c83e]
  - @graviola/store-core@0.4.0
  - @graviola/formula-materialization@0.1.1
  - @graviola/json-schema-utils@1.8.0
  - @graviola/provenance-types@0.2.0
  - @graviola/typed-query-types@0.4.0
  - @graviola/formula-dependency@0.1.1
  - @graviola/formula-runtime@0.1.1
