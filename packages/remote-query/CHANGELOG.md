# @slub/remote-query-implementations

## 1.5.0

### Minor Changes

- 34ce6b4: One endpoint CRUD factory with Allegro/QLever/Oxigraph presets; fetch and auth internals are no longer exported; `resolveSparqlFeatures` is no longer re-exported (use `@graviola/edb-core-utils`).

## 1.4.9

### Patch Changes

- 3f5119c: Add `@graviola/job-schema` and wire `SparqlBackendSpec.graph` / `defaultGraphUris` so job records can live in a named graph (Oxigraph needs the dataset param for reads — E-0).
- Updated dependencies [e46e114]
- Updated dependencies [7c6208f]
  - @graviola/edb-core-utils@1.7.0

## 1.4.8

### Patch Changes

- fix version pinning issues

## 1.4.7

### Patch Changes

- fixing wrong package pinning in release pipeline

## 1.4.2

### Patch Changes

- packaging fixes

## 1.4.1

### Patch Changes

- fixing catalog packaging

## 1.4.0

### Minor Changes

- typesafe filters and redesigned sparql and graph extraction architecture, bug fixes, api stabilisation, features

## 1.3.0

### Minor Changes

- cleanup , stability, virtuoso support, auth support, inverse queries

## 1.2.4

### Patch Changes

- make workspace depenedncies peer depenedncies

## 1.2.3

### Patch Changes

- better linked data handling

## 1.2.2

### Patch Changes

- cleaned up interfaces and simplified initialization of provider and initial setup

## 1.2.1

### Patch Changes

- updated to react-query version 5 and fixes

## 1.2.0

### Minor Changes

- massive refactoring due to separation of dependencies in order to publish the library for universal reuse

## 1.1.0

### Minor Changes

- stabilizing interfaces and make UX and Design improvements in all areas, translation and behavioral adaptation
