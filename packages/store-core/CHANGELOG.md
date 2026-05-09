# @graviola/store-core

## 0.2.1

### Patch Changes

- Verification publish (readme tarball/registry metadata).

## 0.2.0

### Minor Changes

- Introduce `@graviola/store-core` (capability-based Store types, envelopes, descriptors, simulators) and `@graviola/typed-query-types` (extracted Prisma-style query types). SPARQL adapter exposes `initSPARQLStore`, `initSPARQLAbstractDatastore`, and `initSPARQLDatastorePair`. Core types re-export typed filters from the new package with deprecation notices.

### Patch Changes

- Updated dependencies
  - @graviola/typed-query-types@0.2.0
  - @graviola/edb-core-types@1.4.8
