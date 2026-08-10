---
"@graviola/edb-data-mapping": minor
"@graviola/data-mapping-hooks": patch
---

Move makeDefaultMappingStrategyContext from data-mapping-hooks (Layer 3) to edb-data-mapping (Layer 2) for Layer 1/2 compatibility. Re-export from data-mapping-hooks for backward compatibility (deprecated). Introduces MappingStoreProbe interface for minimal store requirements.
