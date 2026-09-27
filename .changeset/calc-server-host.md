---
"@graviola/calc-engine": patch
"@graviola/calc-worker": patch
"@graviola/store-factory": patch
---

Server-side calc warming now uses `SERVER_CALC_HOST` by default, so `eval: "server"` and high-cost slots are materialized.
