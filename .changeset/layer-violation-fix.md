---
"@graviola/edb-import-staging": patch
---

Fix layer violation: import makeDefaultMappingStrategyContext from @graviola/edb-data-mapping instead of @graviola/data-mapping-hooks. The staging context should depend on the mapping engine, not on React hooks.
