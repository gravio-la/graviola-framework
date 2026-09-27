# @graviola/store-factory

## 1.0.0

### Minor Changes

- 2a6d699: `calc` option takes one binding per root type; built stores expose the typed `Calc` facet and `profiles.calc`.
- 629d3f5: Configurable statement history retention (`all` by default, `latest`, `{ keepLast }`, per-path overrides). `@graviola/provenance-types` adds `compareStatementRecency` and `currentStatement`.

### Patch Changes

- 2a6d699: Server-side calc warming now uses `SERVER_CALC_HOST` by default, so `eval: "server"` and high-cost slots are materialized.
- 3f5119c: Add `@graviola/job-schema` and wire `SparqlBackendSpec.graph` / `defaultGraphUris` so job records can live in a named graph (Oxigraph needs the dataset param for reads — E-0).
- Updated dependencies [c449419]
- Updated dependencies [8b5b89a]
- Updated dependencies [8b5b89a]
- Updated dependencies [cafe768]
- Updated dependencies [cafe768]
- Updated dependencies [2a6d699]
- Updated dependencies [f4f4667]
- Updated dependencies [edf5859]
- Updated dependencies [3f5119c]
- Updated dependencies [ed91138]
- Updated dependencies [7c6208f]
- Updated dependencies [7ba3560]
- Updated dependencies [629d3f5]
- Updated dependencies [92d079e]
- Updated dependencies [cd5f266]
  - @graviola/store-core@0.4.0
  - @graviola/calc-engine@0.2.0
  - @graviola/edb-core-types@1.8.0
  - @graviola/sparql-db-impl@1.9.0
  - @graviola/prisma-db-impl@1.7.5
  - @graviola/remote-query-implementations@1.4.9
  - @graviola/meta-schema@0.2.0
  - @graviola/sparql-tools@0.2.1
