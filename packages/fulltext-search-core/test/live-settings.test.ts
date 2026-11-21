import { describe, expect, test } from "bun:test";
import {
  FULLTEXT_SCHEMA_MISMATCH_CODES,
  FullTextEngineError,
  createInMemoryTextIndexAdapter,
  createLiveSettingsCache,
  initFulltextSearchStore,
  liveSettingsFromIndexSettings,
} from "../src/index";
import { loadSearchFacetSchema } from "@graviola/search-facet-schema";

describe("live-settings normalisation", () => {
  test("wildcard searchable", () => {
    expect(
      liveSettingsFromIndexSettings({
        searchableAttributes: ["*"],
        filterableAttributes: ["a"],
      }).kind,
    ).toBe("known");
    const star = liveSettingsFromIndexSettings({
      searchableAttributes: ["*"],
      filterableAttributes: ["a"],
    });
    if (star.kind === "known") expect(star.searchable).toBe("all");
  });

  test("unknown settings probe", () => {
    expect(liveSettingsFromIndexSettings("unknown").kind).toBe("unknown");
  });
});

describe("probe retry on schema mismatch", () => {
  test("invalidates cache and succeeds after settings widen", async () => {
    const adapter = createInMemoryTextIndexAdapter({ strictSchema: true });
    await adapter.ensureIndex("idx", {
      primaryKey: "id",
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName"],
    });
    await adapter.addDocuments("idx", [
      { id: "1", fileName: "hello", __iri: "x", __type: "M" },
    ]);

    let searchCalls = 0;
    let probeCount = 0;
    const wrapped = {
      ...adapter,
      async getIndexSettings(uid: string) {
        probeCount += 1;
        if (probeCount === 1) {
          return {
            primaryKey: "id",
            searchableAttributes: ["fileName", "filePath"],
            filterableAttributes: ["fileName"],
          };
        }
        return {
          primaryKey: "id",
          searchableAttributes: ["fileName"],
          filterableAttributes: ["fileName"],
        };
      },
      async search(uid: string, q: Parameters<typeof adapter.search>[1]) {
        searchCalls += 1;
        if (searchCalls === 1) {
          throw new FullTextEngineError("invalid", {
            status: 400,
            code: "invalid_search_attributes_to_search_on",
            indexUid: uid,
          });
        }
        return adapter.search(uid, q);
      },
    };

    const sidecar = loadSearchFacetSchema({
      fulltextIndex: {
        scopes: {
          "#/definitions/Manifestation/properties/fileName": {},
          "#/definitions/Manifestation/properties/filePath": {},
        },
        types: { Manifestation: { searchable: true } },
      },
    });

    const store = initFulltextSearchStore({
      adapter: wrapped,
      primaryStore: {
        storeId: "p",
        capabilities: { loads: true },
        typeNameToTypeIRI: () => "M",
      } as never,
      searchFacetSchema: sidecar,
      schema: { type: "object", definitions: {} } as never,
      primaryFields: { Manifestation: { label: "fileName" } },
      indexNameForType: () => "idx",
      existingIndexTypes: ["Manifestation"],
    });

    const result = await store.searchDocuments("Manifestation", "hello", {
      limit: 5,
    });
    expect(result.documents.length).toBe(1);
    expect(searchCalls).toBe(2);
    expect(
      FULLTEXT_SCHEMA_MISMATCH_CODES.has(
        "invalid_search_attributes_to_search_on",
      ),
    ).toBe(true);
  });
});

describe("getIndexSettings unknown does not block search", () => {
  test("runs with desired fields when settings are unknown", async () => {
    const adapter = createInMemoryTextIndexAdapter({ strictSchema: true });
    await adapter.ensureIndex("idx", {
      primaryKey: "id",
      searchableAttributes: ["fileName", "filePath"],
      filterableAttributes: ["fileName"],
    });
    await adapter.addDocuments("idx", [
      { id: "1", fileName: "z", __iri: "x", __type: "M" },
    ]);

    const wrapped = {
      ...adapter,
      async getIndexSettings() {
        return "unknown" as const;
      },
    };

    const sidecar = loadSearchFacetSchema({
      fulltextIndex: {
        scopes: { "#/definitions/Manifestation/properties/fileName": {} },
        types: { Manifestation: { searchable: true } },
      },
    });

    const store = initFulltextSearchStore({
      adapter: wrapped,
      primaryStore: {
        storeId: "p",
        capabilities: { loads: true },
        typeNameToTypeIRI: () => "M",
      } as never,
      searchFacetSchema: sidecar,
      schema: { type: "object", definitions: {} } as never,
      primaryFields: { Manifestation: { label: "fileName" } },
      indexNameForType: () => "idx",
      existingIndexTypes: ["Manifestation"],
    });

    const result = await store.searchDocuments("Manifestation", "z", {
      limit: 5,
    });
    expect(result.documents.length).toBe(1);
  });
});

describe("createLiveSettingsCache", () => {
  test("invalidates after manual invalidate", async () => {
    let calls = 0;
    const base = createInMemoryTextIndexAdapter();
    await base.ensureIndex("idx", {
      primaryKey: "id",
      searchableAttributes: ["a"],
      filterableAttributes: ["a"],
    });
    const adapter = {
      ...base,
      async getIndexSettings(uid: string) {
        calls += 1;
        return base.getIndexSettings!(uid);
      },
    };
    const cache = createLiveSettingsCache(adapter, { ttlMs: 60_000 });
    await cache.get("idx");
    cache.invalidate("idx");
    await cache.get("idx");
    expect(calls).toBe(2);
  });
});
