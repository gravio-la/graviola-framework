# @graviola/typed-query-types

## 0.2.0

### Minor Changes

- Introduce `@graviola/store-core` (capability-based Store types, envelopes, descriptors, simulators) and `@graviola/typed-query-types` (extracted Prisma-style query types). SPARQL adapter exposes `initSPARQLStore`, `initSPARQLAbstractDatastore`, and `initSPARQLDatastorePair`. Core types re-export typed filters from the new package with deprecation notices.
