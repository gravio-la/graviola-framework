# @graviola/typed-query-types

Recursive Prisma-style query types (`TypedWhereInput`, `TypedIncludePattern`, flavour-aware `where`, etc.) extracted from `@graviola/edb-core-types` for use by `@graviola/store-core` and other Layer 1 packages.

Consumers that previously imported these types from `@graviola/edb-core-types` continue to work unchanged; the core-types package re-exports from here with deprecation notices on the legacy path.
