---
"@graviola/edb-import-staging": patch
---

Add datasetN3 to snapshot() output for full changeSet persistence. The snapshot now includes N-Triples serialization of the RDF dataset alongside entity metadata, enabling complete rehydration via initialState option.
