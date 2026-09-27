---
"@graviola/edb-core-utils": minor
"@graviola/edb-advanced-components": patch
"@graviola/edb-detail-renderer-core": patch
"@graviola/edb-detail-renderer": patch
"@graviola/edb-basic-renderer": patch
---

edb-core-utils: changes since 1.6.1 plus the wave-1 review cleanup.

- New since 1.6.1: thumbnail URL helpers (`applyResolveThumbnailUrl`, `thumbnailWidthHint`, …), calc recalculation support, `resolveSparqlFeatures`.
- `encodeIRI`/`decodeIRI` now use base64url over UTF-8: safe in URL paths and query strings, no browser crash on non-ASCII IRIs. `decodeIRI` still accepts the old standard-base64 values.
- Removed helpers that duplicated lodash or the platform: `camelCaseToTitleCase` (use lodash `startCase`), `leftpad` (use `padStart`), `ellipsis`, `resolveObj`.
- Removed unused exports: `hexToRGBA`, `index2letter`, `foldInner2Outer`, `replaceJSONLD`, the permission constants, `isUndefOrEmpty`. `filterJSONLD` and `getJSDate` are no longer exported. `NamedEntityData`/`NamedAndTypedEntity` now come only from `@graviola/edb-core-types`.
- Tests run on `bun test`.

Consumers: property labels now use lodash `startCase` (e.g. "My IRI" instead of "My I R I").
