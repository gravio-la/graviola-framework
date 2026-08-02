# Domain: `geo`

Simplified geographic places for filter / pagination Storybook demos
(population thresholds, name contains `"burg"`, nested child counts).

## What’s inside

| Artifact                     | Role                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`domain.ts`](domain.ts)     | One-sheet wiring (start here)                                                                                                                                                         |
| `@graviola/sample-data-geo`  | Shared `geoSchema` / `primaryFields` / committed Turtle for Storybook & tests                                                                                                         |
| [`mappings.ts`](mappings.ts) | Wikidata → schema (`P1082`, `P131`, `P625`, `P571`, `P18`, labels/aliases). Forward `contains` is materialized from inverted `partOf` after mapping (P150 analogue, closed subgraph). |
| [`select.rq`](select.rq)     | Seed cities in Saxony / Saxony-Anhalt / Brandenburg                                                                                                                                   |
| [`cache/`](cache/)           | Committed SPARQL + `wbgetentities` responses                                                                                                                                          |
| [`out/geo.ttl`](out/geo.ttl) | Committed Turtle (sync into `@graviola/sample-data-geo` after regen)                                                                                                                  |

## Current snapshot (reproducible offline)

Regenerate with `bun run generate:geo` (or `--offline` from cache).

Approximate counts from the last generation:

- **127** `City` entities (seeds)
- **112** `Place` entities (P131 parents: districts, states, Germany, …)
- **~2407** triples (includes forward `contains` = inverted `partOf`)
- **17+** names containing `burg` (e.g. Rothenburg, Annaburg, Quedlinburg, Magdeburg…)
- `partOf` chains up to depth 6 (city → municipality → association → district → state → country)
- `contains` on parents (e.g. Landkreis Görlitz → 12 cities) for forward `include` pagination

## Intended filter scenarios (later Storybook)

These are **not** implemented here — this domain only supplies the data:

1. Cities with `population < 20000`
2. Places whose `name` contains `"burg"`
3. Nested: places with at least 5 `parts` (via `x-inverseOf`) whose name contains `"burg"` — known gap until issue #5
4. Pagination / `take` / `orderBy` over **forward** `contains` (stored child links)

## Query notes

`select.rq` lists place types via `VALUES` (city, big city, German municipality)
instead of `wdt:P31/wdt:P279*`, which tends to 502 on WDQS. Parents beyond the
seed set are discovered during step 3 via `createEntityWithAuthoritativeLink`
on `P131`.
