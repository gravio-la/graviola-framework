# @graviola/formula-materialization

## 0.1.1

### Patch Changes

- cafe768: Materialization freshness and materialized reads use the latest statement only (`currentStatement` from `@graviola/provenance-types`), so values that change back (A→B→A) are recomputed and reads never serve an older historic value.
- Updated dependencies [c449419]
- Updated dependencies [629d3f5]
- Updated dependencies [cd5f266]
  - @graviola/store-core@0.4.0
  - @graviola/provenance-types@0.2.0
  - @graviola/formula-dependency@0.1.1
  - @graviola/formula-runtime@0.1.1
