---
"@graviola/sparql-schema": minor
"@graviola/edb-graph-traversal": minor
---

Remove unused exports (cast helpers, variable helpers, trash queries, field-mapping select, loadEntityBasics); internal query builders and filter operators are no longer exported. Filters use CONTAINS/STRSTARTS instead of REGEX, and LIMIT/OFFSET must be non-negative integers. graph-traversal exports `isNestedFilterOptions` and `extractNestedFilterOptions`.
