# @graviola/meilisearch-sparql-store

Meilisearch adapter + thin wiring over [`@graviola/fulltext-search-core`](../fulltext-search-core):

- **Per-type indexes** driven by a [`SearchFacetSchema`](../search-facet-schema) sidecar
- **Composite store** — Meilisearch for ranked text search & facets; any primary store (`initSPARQLStore`, Prisma, REST, in-memory Comunica, …) for hydration, CRUD, and SPARQL REGEX fallback
- **JSON-LD results** — `searchDocuments(typeName, …)` returns documents with `@id` / `@type`; optional `hydrate: true` merges primary-store RDF

Engine-agnostic routing, bootstrap, and import projection live in `@graviola/fulltext-search-core` (`FullTextSearchAdapter` seam for future Elasticsearch / Solr / Lunr adapters).

## Usage

```typescript
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import {
  initMeilisearchSparqlStore,
  prepareMeilisearchIndexes,
} from "@graviola/meilisearch-sparql-store";

const primaryStore = initSPARQLStore({
  /* schema, SPARQL CRUD, … */
});

// Bootstrap (optional — run once per deployment)
await prepareMeilisearchIndexes({
  adapter: createMeilisearchAdapter({ baseUrl: "http://localhost:7700" }),
  searchFacetSchema,
  schema,
  primaryFields,
});

const store = initMeilisearchSparqlStore({
  primaryStore,
  meilisearch: { baseUrl: "http://localhost:7700" },
  schema,
  primaryFields,
  searchFacetSchema,
});

// Import FT projections from any source store with Lists
await store.importAllSearchableTypes(primaryStore);

// Search — JSON-LD stubs (fast) or hydrated
const { documents } = await store.searchDocuments("Exhibition", "modern", {
  limit: 20,
  hydrate: false,
});
```

## Tests

```bash
bun test                          # unit tests (mocked fetch)
docker compose up -d --wait
MEILI_URL=http://localhost:7700 bun test test/e2e.test.ts
```
