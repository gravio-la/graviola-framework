---
"@graviola/sparql-schema": patch
---

Fix annotationProjectionsToSparql to correctly walk intermediate path segments for nested meta annotations. Now generates proper triple patterns for scopes like $meta/provenance/activityId instead of skipping intermediate nodes. Deduplicates shared path segments across multiple projections.
