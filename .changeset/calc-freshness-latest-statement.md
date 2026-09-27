---
"@graviola/formula-materialization": patch
"@graviola/calc-engine": patch
---

Materialization freshness and materialized reads use the latest statement only (`currentStatement` from `@graviola/provenance-types`), so values that change back (A→B→A) are recomputed and reads never serve an older historic value.
