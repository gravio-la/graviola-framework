---
"@graviola/store-core": minor
---

store-core: changes since 0.3.3 plus the wave-1 review cleanup.

- New since 0.3.3: `Statements` capability and `statementMeta` descriptor profile, `annotationScopes` in list queries, `entityIRIs` and `selectionDepth` in typed `filterMany`, `Calc` capability with warm results, `DocumentSearches` with facets, SPARQL feature flags in descriptors.
- Removed the unused write-document interceptors (`WriteDocumentInterceptor`, `WriteDocumentContext`, `composeWriteDocumentInterceptors`, `noopWriteDocumentInterceptor`).
