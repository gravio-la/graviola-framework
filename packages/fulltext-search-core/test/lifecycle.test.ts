import { describe, expect, test } from "bun:test";
import { loadSearchFacetSchema } from "@graviola/search-facet-schema";

import {
  clearFulltextIndexes,
  createCalcEnrichEntityForIndex,
  createInMemoryTextIndexAdapter,
  describeFulltextIndexes,
  diffFulltextIndexes,
  diffIndexSettings,
  initFulltextSearchStore,
  populateFromStore,
  pushFulltextIndexes,
  reindexFromStore,
  resetFulltextIndexes,
} from "../src/index";

const sidecar = loadSearchFacetSchema({
  fulltextIndex: {
    scopes: {
      "#/definitions/Exhibition/properties/title": {},
    },
  },
  facets: {
    scopes: {
      "#/definitions/Exhibition/properties/year": { facet: "range" },
      "#/definitions/Exhibition/properties/venue": { facet: "filter" },
    },
  },
});

const primaryFields = {
  Exhibition: { label: "title" },
};

describe("diffIndexSettings", () => {
  test("detects order-insensitive equality", () => {
    expect(
      diffIndexSettings(
        {
          searchableAttributes: ["a", "b"],
          filterableAttributes: ["x"],
          sortableAttributes: [],
        },
        {
          searchableAttributes: ["b", "a"],
          filterableAttributes: ["x"],
          sortableAttributes: [],
        },
      ),
    ).toBeNull();
  });

  test("flags searchable drift", () => {
    const drift = diffIndexSettings(
      {
        searchableAttributes: ["title"],
        filterableAttributes: [],
      },
      {
        searchableAttributes: ["title", "description"],
        filterableAttributes: [],
      },
    );
    expect(drift?.searchableAttributes).toBe(true);
    expect(drift?.filterableAttributes).toBe(false);
  });
});

describe("lifecycle with in-memory adapter", () => {
  test("push, describe, populate, clear, reset", async () => {
    const adapter = createInMemoryTextIndexAdapter();
    const lifecycle = {
      adapter,
      searchFacetSchema: sidecar,
      primaryFields,
    };

    const before = await diffFulltextIndexes(lifecycle);
    expect(before.hasDrift).toBe(true);
    expect(before.types.find((t) => t.typeName === "Exhibition")?.exists).toBe(
      false,
    );

    await pushFulltextIndexes(lifecycle);

    const afterPush = await describeFulltextIndexes(lifecycle);
    expect(afterPush.hasDrift).toBe(false);
    const exhibition = afterPush.types.find((t) => t.typeName === "Exhibition");
    expect(exhibition?.exists).toBe(true);
    expect(exhibition?.numberOfDocuments).toBe(0);
    expect(exhibition?.searchableAttributes).toContain("title");
    expect(exhibition?.filterableAttributes).toContain("year");
    expect(exhibition?.filterableAttributes).toContain("venue");
    expect(exhibition?.sortableAttributes).toContain("year");

    const primaryStore = {
      storeId: "mock",
      capabilities: {
        identifies: true,
        loads: true,
        lists: true,
      },
      typeNameToTypeIRI: (t: string) => `http://ex.org/${t}`,
      typeIRItoTypeName: () => "Exhibition",
      loadOne: async () => null,
      list: async () => [
        {
          "@id": "http://ex.org/e/1",
          "@type": "http://ex.org/Exhibition",
          title: "Summer",
          venue: "Hall",
          year: 2024,
        },
        {
          "@id": "http://ex.org/e/2",
          "@type": "http://ex.org/Exhibition",
          title: "Winter",
          venue: "Hall",
          year: 2025,
        },
      ],
    };

    const ftStore = initFulltextSearchStore({
      adapter,
      primaryStore: primaryStore as never,
      searchFacetSchema: sidecar,
      schema: {},
      primaryFields,
    });

    const populated = await populateFromStore({
      ...lifecycle,
      ftStore,
      source: primaryStore,
    });
    expect(populated.total).toBe(2);
    expect(populated.byType.Exhibition).toBe(2);

    const afterPopulate = await describeFulltextIndexes(lifecycle);
    expect(
      afterPopulate.types.find((t) => t.typeName === "Exhibition")
        ?.numberOfDocuments,
    ).toBe(2);

    await clearFulltextIndexes(lifecycle);
    expect(
      (await describeFulltextIndexes(lifecycle)).types.find(
        (t) => t.typeName === "Exhibition",
      )?.numberOfDocuments,
    ).toBe(0);

    await resetFulltextIndexes(lifecycle);
    expect(
      (await diffFulltextIndexes(lifecycle)).types.find(
        (t) => t.typeName === "Exhibition",
      )?.exists,
    ).toBe(false);

    const reindexed = await reindexFromStore({
      ...lifecycle,
      ftStore,
      source: primaryStore,
      full: true,
    });
    expect(reindexed.mode).toBe("full");
    expect(reindexed.populate.total).toBe(2);
  });

  test("enrichEntityForIndex merges calc values on import", async () => {
    const adapter = createInMemoryTextIndexAdapter();
    await pushFulltextIndexes({
      adapter,
      searchFacetSchema: sidecar,
      primaryFields,
    });

    const calcStore = {
      capabilities: { calc: true as const },
      readCalcValues: async () => ({
        value: { title: "Computed Title" },
      }),
    };

    const primaryStore = {
      storeId: "mock",
      capabilities: { identifies: true, loads: true, lists: true },
      typeNameToTypeIRI: (t: string) => `http://ex.org/${t}`,
      typeIRItoTypeName: () => "Exhibition",
      loadOne: async (_t: string, iri: string) => ({
        "@id": iri,
        "@type": "http://ex.org/Exhibition",
        venue: "A",
      }),
      list: async () => [],
    };

    const ftStore = initFulltextSearchStore({
      adapter,
      primaryStore: primaryStore as never,
      searchFacetSchema: sidecar,
      schema: {},
      primaryFields,
      enrichEntityForIndex: createCalcEnrichEntityForIndex(calcStore),
    });

    await ftStore.importOne(
      "Exhibition",
      "http://ex.org/e/calc",
      primaryStore as never,
    );

    const docs = adapter.getIndex("Exhibition");
    expect(docs).toHaveLength(1);
    expect(docs[0]?.title).toBe("Computed Title");
  });
});
