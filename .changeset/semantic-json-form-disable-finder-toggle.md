---
"@graviola/semantic-json-form": patch
"@graviola/semantic-jsonform-types": patch
---

`SemanticJsonFormNoOps` no longer shows the floating similarity-finder toggle on forms without a `formsPath`. The global search path starts out `undefined`, so `formsPath === globalPath` matched every such form and the toggle appeared permanently. Forms that own the search path (`EditEntityModal`, nested linked-entity forms) behave as before. The `formsPath` and `disableSimilarityFinder` props are now documented.
