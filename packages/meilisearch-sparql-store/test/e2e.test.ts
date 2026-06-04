import { describe, expect, test } from "bun:test";

import {
  createMeilisearchAdapter,
  initMeilisearchSparqlStore,
  prepareMeilisearchIndexes,
} from "../src/index";
import {
  createFixturePrimaryStore,
  fixturePrimaryFields,
  fixtureSchema,
  fixtureSidecar,
} from "./fixtures/create-fixture-primary-store";

const MEILI_URL = process.env.MEILI_URL?.trim();

describe.skipIf(!MEILI_URL)("meilisearch e2e", () => {
  test("prepare indexes, import, search JSON-LD, hydrate, fallback, facets", async () => {
    const meili = {
      baseUrl: MEILI_URL!,
      apiKey: process.env.MEILI_API_KEY?.trim() || undefined,
    };
    const adapter = createMeilisearchAdapter(meili);
    const indexPrefix = `e2e-${Date.now()}-`;

    const prepareResult = await prepareMeilisearchIndexes({
      adapter,
      searchFacetSchema: fixtureSidecar,
      schema: fixtureSchema,
      primaryFields: fixturePrimaryFields,
      indexNameForType: (t) => `${indexPrefix}${t}`,
    });

    const exhibitionSummary = prepareResult.types.find(
      (t) => t.typeName === "Exhibition",
    );
    expect(exhibitionSummary?.searchable).toBe(true);
    expect(exhibitionSummary?.searchableAttributes).toContain("title");
    expect(exhibitionSummary?.filterableAttributes).toContain("venue");

    const placeSummary = prepareResult.types.find(
      (t) => t.typeName === "Place",
    );
    expect(placeSummary?.searchableAttributes).toEqual([
      "placeName",
      "description",
    ]);

    const primaryStore = await createFixturePrimaryStore();

    const ftStore = initMeilisearchSparqlStore({
      primaryStore,
      meilisearch: meili,
      schema: fixtureSchema,
      primaryFields: fixturePrimaryFields,
      searchFacetSchema: fixtureSidecar,
      indexNameForType: (t) => `${indexPrefix}${t}`,
    });

    const imported = await ftStore.importAllSearchableTypes(primaryStore, {
      order: ["Place", "Artist", "Exhibition"],
      limit: 100,
    });
    expect(imported.Exhibition?.length).toBe(2);
    expect(imported.Artist?.length).toBe(2);
    expect(imported.Place?.length).toBe(2);

    const stubResult = await ftStore.searchDocuments("Exhibition", "Modern", {
      hydrate: false,
    });
    expect(stubResult.documents.length).toBeGreaterThanOrEqual(1);
    const stub = stubResult.documents[0]!;
    expect(stub["@id"]).toContain("exhibition-1");
    expect(stub["@type"]).toBe("http://example.org/ontology#Exhibition");
    expect(stub.title).toBe("Modern Masters");

    const hydrated = await ftStore.searchDocuments("Artist", "Monet", {
      hydrate: true,
      limit: 5,
    });
    expect(hydrated.documents[0]?.name).toBe("Claude Monet");
    expect(hydrated.documents[0]?.bio).toContain("impressionist");

    const curatorHits = await ftStore.searchText("Curator", "Jane", {
      limit: 5,
    });
    expect(curatorHits.some((h) => h.iri.includes("curator-1"))).toBe(true);

    const facets = await ftStore.facet("Exhibition", {
      facets: ["venue", "year"],
    });
    expect(facets.facets.venue?.length).toBeGreaterThan(0);
    expect(
      facets.facets.venue?.some((b) => String(b.value).includes("National")),
    ).toBe(true);

    for (const typeName of ["Exhibition", "Artist", "Place"]) {
      await adapter.deleteIndex?.(`${indexPrefix}${typeName}`);
    }
  }, 120_000);
});
