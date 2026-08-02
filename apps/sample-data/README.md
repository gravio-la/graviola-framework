# `@graviola/sample-data`

Reproducible **Wikidata → Turtle** seed-data generator for Graviola demos and Storybook.

This app’s sole job is to turn a domain’s Wikidata SPARQL seed query into a
committed Turtle file, using the same declarative-mapping machinery that
powers authority import elsewhere in the framework. Generated Turtle is
meant to be loaded into Oxigraph / Blazegraph / Virtuoso / in-memory stores
later — that loading step is out of scope here.

## The three steps

Every domain generation run prints the same pipeline:

```
[1/3] SPARQL SELECT    N Q-IDs           (cache hit|fetched)
[2/3] entity fetch     N seeds            (… fetched, … cached)
[3/3] map + stage      M documents        (… City, … Place)
      wrote out/<domain>.ttl              (T triples)
```

| Step               | What happens                                                                                   | Where to look                        |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------ |
| **1. Query**       | `SELECT` against `https://query.wikidata.org/sparql`                                           | `domains/<name>/select.rq`           |
| **2. Extract**     | `wbgetentities` for each Q-ID (and parents during mapping)                                     | `domains/<name>/cache/entities/`     |
| **3. Map + store** | `mapByConfig` + `createEntityWithAuthoritativeLink` → staged change set → deterministic Turtle | `domains/<name>/mappings.ts`, `out/` |

Raw Wikidata responses are **committed** under `cache/` so regeneration is
offline and byte-stable (`--offline`). Use `--refresh` to re-fetch.

## Quick start

```bash
# from the graviola-framework repo root
cd apps/sample-data
bun install   # if needed (workspace)

bun run list
bun run generate:geo              # full geo dataset
bun run src/cli.ts generate geo --limit 20
bun run src/cli.ts generate geo --offline
bun test
```

## Layout

```
apps/sample-data/
├── src/
│   ├── cli.ts                 # list | generate
│   └── pipeline/              # shared three-step engine
└── domains/
    └── geo/                   # one folder per domain
        ├── domain.ts          # ← THE one sheet (start here)
        ├── schema.ts
        ├── mappings.ts
        ├── select.rq
        ├── primaryFields.ts
        ├── cache/             # committed raw Wikidata responses
        └── out/geo.ttl        # committed output
```

## How to add a domain

1. Copy `domains/geo/` to `domains/<yours>/`.
2. Edit `schema.ts` (JSON Schema, **no SLUB namespace** — use
   `http://ontologies.gra.one/samples/<yours>#`).
3. Edit `mappings.ts` (declarative Wikidata paths → schema fields).
4. Edit `select.rq` (keep it WDQS-friendly: avoid heavy `P279*` stars).
5. Wire the one-sheet `domain.ts` via `defineSampleDomain({...})`.
6. Register it in [`src/domains.ts`](src/domains.ts).
7. Run `bun run src/cli.ts generate <yours>` and commit `cache/` + `out/`.

## Namespaces (geo)

- Vocabulary: `http://ontologies.gra.one/samples/geo#`
- Instances: `http://ontologies.gra.one/samples/geo/{Type}/{QID}`

IRIs are derived from Wikidata Q-IDs so re-runs produce empty diffs.

## Relation to authority-wikidata / exhibition import

The **mechanism** matches
`@graviola/authority-wikidata` / `@graviola/edb-import-demo-schema`
(`mapByConfig`, `createEntityWithAuthoritativeLink`, staging change sets).
The **vocabulary does not** — this app never uses the SLUB exhibition
namespace. Sample domains are intentionally self-contained under
`ontologies.gra.one/samples/`.
