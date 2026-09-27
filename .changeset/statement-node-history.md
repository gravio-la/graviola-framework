---
"@graviola/sparql-db-impl": patch
"@graviola/statement-meta": patch
---

Statement writes no longer multiply the statement history: old statement sidecar subgraphs are removed before re-persisting, and statement nodes are deduplicated per value (latest `generatedAt` wins).
