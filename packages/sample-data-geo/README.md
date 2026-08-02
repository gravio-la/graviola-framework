# `@graviola/sample-data-geo`

Committed Wikidata-derived geographic sample fixtures for Storybook and tests.

Hierarchy edges:

- `partOf` — mapped from Wikidata P131 (child → parent)
- `contains` — forward parent → child, **materialized** from inverted `partOf`
  after canonicalize (so `include.contains { take/skip/orderBy }` works without
  waiting on `x-inverseOf` / issue #5). Wikidata analogue: P150.
- `parts` — schema-only `x-inverseOf` → `partOf` (filter path still broken)

**Do not regenerate this package in CI.** The Turtle is synced from
`apps/sample-data/domains/geo/out/geo.ttl` into a TypeScript string module so
consumers can `import { geoTurtle } from "@graviola/sample-data-geo"` with no
fetch and no bundler plugin.

## Exports

| Export                                          | Purpose                                               |
| ----------------------------------------------- | ----------------------------------------------------- |
| `geoTurtle`                                     | Full Turtle document as a string                      |
| `geoSchema`                                     | JSON Schema (`City` / `Place` / `Region` / `Country`) |
| `geoPrimaryFields`                              | Label / description / image field map                 |
| `geoTypeNameToTypeIRI` / `geoTypeIRIToTypeName` | Type IRI helpers                                      |
| `GEO_VOCAB_BASE` / `GEO_INSTANCE_BASE`          | Namespace constants                                   |
| `geoTableUiSchema`                              | Default JSON-LD table column whitelist                |
| `geoStats`                                      | Expected entity counts (drift-checked)                |

## Sync after regenerating sample data

```bash
bun run sample:geo                              # regenerate apps/sample-data/.../out/geo.ttl
bun run --filter @graviola/sample-data-geo sync # refresh src/geo.turtle.generated.ts
# update geoStats in src/stats.ts if counts changed
bun run --filter @graviola/sample-data-geo test
bun run --filter @graviola/sample-data-geo build
```
