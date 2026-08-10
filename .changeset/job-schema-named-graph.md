---
"@graviola/job-schema": minor
"@graviola/store-factory": patch
"@graviola/remote-query-implementations": patch
---

Add `@graviola/job-schema` and wire `SparqlBackendSpec.graph` / `defaultGraphUris` so job records can live in a named graph (Oxigraph needs the dataset param for reads — E-0).
