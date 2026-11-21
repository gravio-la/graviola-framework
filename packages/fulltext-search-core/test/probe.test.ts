import { describe, expect, test } from "bun:test";
import { loadSearchFacetSchema } from "@graviola/search-facet-schema";
import {
  IndexSchemaMismatchError,
  createInMemoryTextIndexAdapter,
  createLiveSettingsCache,
  initFulltextSearchStore,
  liveSettingsFromIndexSettings,
} from "../src/index";
import { probeSortFields } from "../src/probe-query";

const sidecar = loadSearchFacetSchema({
  fulltextIndex: {
    scopes: {
      "#/definitions/Manifestation/properties/fileName": {},
      "#/definitions/Manifestation/properties/filePath": {},
      "#/definitions/Manifestation/properties/parentPath": {},
    },
    types: { Manifestation: { searchable: true } },
  },
  facets: {
    scopes: {
      "#/definitions/Manifestation/properties/cameraModel": { facet: "filter" },
      "#/definitions/Manifestation/properties/modificationTime": {
        facet: "range",
        numericField: "modificationTimeEpoch",
      },
    },
  },
});

const schema = {
  type: "object",
  definitions: {
    Manifestation: {
      type: "object",
      properties: {
        fileName: { type: "string" },
        filePath: { type: "string" },
        parentPath: { type: "string" },
        cameraModel: { type: "string" },
        modificationTime: { type: "string" },
      },
    },
  },
} as const;

describe("liveSettingsFromIndexSettings", () => {
  test("treats empty searchable as all", () => {
    const live = liveSettingsFromIndexSettings({
      searchableAttributes: [],
      filterableAttributes: ["fileName"],
    });
    expect(live.kind).toBe("known");
    if (live.kind === "known") expect(live.searchable).toBe("all");
  });

  test("retains sortable attributes", () => {
    const live = liveSettingsFromIndexSettings({
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName"],
      sortableAttributes: ["fileName", "sizeBytes"],
    });
    expect(live.kind).toBe("known");
    if (live.kind === "known" && live.sortable !== "all") {
      expect(live.sortable.has("fileName")).toBe(true);
      expect(live.sortable.has("sizeBytes")).toBe(true);
    }
  });

  test("normalises granular filterable patterns", () => {
    const live = liveSettingsFromIndexSettings({
      searchableAttributes: ["fileName"],
      filterableAttributes: [
        { attributePatterns: ["ancestors", "depth"] },
      ] as unknown as string[],
    });
    expect(live.kind).toBe("known");
    if (live.kind === "known" && live.filterable !== "all") {
      expect(live.filterable.has("ancestors")).toBe(true);
      expect(live.filterable.has("depth")).toBe(true);
    }
  });
});

describe("probeSortFields", () => {
  test("retains sortableAttributes in LiveSettings", () => {
    const live = liveSettingsFromIndexSettings({
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName"],
      sortableAttributes: ["fileName", "sizeBytes", "modificationTimeEpoch"],
    });
    expect(live.kind).toBe("known");
    if (live.kind === "known" && live.sortable !== "all") {
      expect(live.sortable.has("fileName")).toBe(true);
      expect(live.sortable.has("sizeBytes")).toBe(true);
      expect(live.sortable.has("modificationTimeEpoch")).toBe(true);
    }
  });

  test("intersects with live sortables and maps asc/desc", () => {
    const live = liveSettingsFromIndexSettings({
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName"],
      sortableAttributes: ["fileName", "sizeBytes"],
    });
    const dropped: string[] = [];
    const result = probeSortFields(
      [
        { field: "fileName", desc: false },
        { field: "sizeBytes", desc: true },
        { field: "missingField" },
      ],
      live,
      { warnDropped: (f) => dropped.push(f) },
    );
    expect(result.sort).toEqual(["fileName:asc", "sizeBytes:desc"]);
    expect(result.droppedSortFields).toEqual(["missingField"]);
    expect(dropped).toEqual(["missingField"]);
  });

  test("passes sort through when live settings are unknown", () => {
    const result = probeSortFields(
      [{ field: "fileName", desc: true }],
      { kind: "unknown" },
      { warnDropped: () => {} },
    );
    expect(result.sort).toEqual(["fileName:desc"]);
    expect(result.droppedSortFields).toEqual([]);
  });

  test("searchDocuments forwards sort and drops non-sortable fields", async () => {
    const adapter = createInMemoryTextIndexAdapter({ strictSchema: false });
    let lastSort: string[] | undefined;
    const wrapped = {
      ...adapter,
      async search(uid: string, q: Parameters<typeof adapter.search>[1]) {
        lastSort = q.sort;
        return adapter.search(uid, q);
      },
    };
    await wrapped.ensureIndex("file-metadata", {
      primaryKey: "id",
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName"],
      sortableAttributes: ["fileName"],
    });
    await wrapped.addDocuments("file-metadata", [
      { id: "1", __iri: "http://ex/m/1", fileName: "b" },
      { id: "2", __iri: "http://ex/m/2", fileName: "a" },
    ]);

    const store = initFulltextSearchStore({
      adapter: wrapped,
      primaryStore: {
        storeId: "primary",
        capabilities: { loads: true },
        typeNameToTypeIRI: () => "Manifestation",
      } as never,
      searchFacetSchema: sidecar,
      schema: schema as never,
      primaryFields: { Manifestation: { label: "fileName" } },
      indexNameForType: () => "file-metadata",
      existingIndexTypes: ["Manifestation"],
    });

    const ordered = await store.searchDocuments("Manifestation", "", {
      limit: 10,
      sort: [
        { field: "fileName", desc: false },
        { field: "sizeBytes", desc: true },
      ],
    });
    expect(lastSort).toEqual(["fileName:asc"]);
    expect(ordered.documents.map((d) => d.fileName)).toEqual(["a", "b"]);
  });
});

describe("initFulltextSearchStore probe", () => {
  test("intersects attributesToSearchOn with live searchable", async () => {
    const adapter = createInMemoryTextIndexAdapter({ strictSchema: true });
    await adapter.ensureIndex("file-metadata", {
      primaryKey: "id",
      searchableAttributes: ["fileName", "filePath"],
      filterableAttributes: ["fileName", "__type"],
    });
    await adapter.addDocuments("file-metadata", [
      {
        id: "1",
        __iri: "http://ex/m/1",
        __type: "Manifestation",
        fileName: "notes.pdf",
      },
    ]);

    const store = initFulltextSearchStore({
      adapter,
      primaryStore: {
        storeId: "primary",
        capabilities: { loads: true },
        typeNameToTypeIRI: () => "Manifestation",
      } as never,
      searchFacetSchema: sidecar,
      schema: schema as never,
      primaryFields: { Manifestation: { label: "fileName" } },
      indexNameForType: () => "file-metadata",
      existingIndexTypes: ["Manifestation"],
    });

    const result = await store.searchDocuments("Manifestation", "notes", {
      limit: 5,
    });
    expect(result.documents.length).toBe(1);
    expect(result.droppedSearchFields).toContain("parentPath");
  });

  test("throws IndexSchemaMismatchError when filter is not filterable", async () => {
    const adapter = createInMemoryTextIndexAdapter({ strictSchema: true });
    await adapter.ensureIndex("file-metadata", {
      primaryKey: "id",
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName"],
    });

    const store = initFulltextSearchStore({
      adapter,
      primaryStore: {
        storeId: "primary",
        capabilities: { loads: true },
        typeNameToTypeIRI: () => "Manifestation",
      } as never,
      searchFacetSchema: sidecar,
      schema: schema as never,
      primaryFields: { Manifestation: { label: "fileName" } },
      indexNameForType: () => "file-metadata",
      existingIndexTypes: ["Manifestation"],
    });

    await expect(
      store.searchDocuments("Manifestation", "", {
        limit: 5,
        filters: [{ field: "ancestors", value: "http://ex/d/1" }],
      }),
    ).rejects.toBeInstanceOf(IndexSchemaMismatchError);
  });

  test("adaptFiltersForLiveIndex may return undefined when all filters are dropped", async () => {
    const adapter = createInMemoryTextIndexAdapter({ strictSchema: true });
    await adapter.ensureIndex("file-metadata", {
      primaryKey: "id",
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName"],
    });
    await adapter.addDocuments("file-metadata", [
      { id: "1", __iri: "http://ex/m/1", fileName: "hit" },
    ]);

    const store = initFulltextSearchStore({
      adapter,
      primaryStore: {
        storeId: "primary",
        capabilities: { loads: true },
        typeNameToTypeIRI: () => "http://ex.org/Item",
      } as never,
      searchFacetSchema: sidecar,
      schema: schema as never,
      primaryFields: { Manifestation: { label: "fileName" } },
      indexNameForType: () => "file-metadata",
      existingIndexTypes: ["Manifestation"],
      adaptFiltersForLiveIndex: () => undefined,
    });

    const result = await store.searchDocuments("Manifestation", "hit", {
      limit: 5,
      filters: [{ field: "bootstrap", value: "x" }],
    });
    expect(result.documents).toHaveLength(1);
  });

  test("adaptFiltersForLiveIndex can rewrite filters before validation", async () => {
    const adapter = createInMemoryTextIndexAdapter({ strictSchema: true });
    await adapter.ensureIndex("file-metadata", {
      primaryKey: "id",
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName", "kind"],
    });
    await adapter.addDocuments("file-metadata", [
      {
        id: "1",
        __iri: "http://ex/m/1",
        fileName: "target",
        kind: "a",
      },
      {
        id: "2",
        __iri: "http://ex/m/2",
        fileName: "other",
        kind: "b",
      },
    ]);

    const store = initFulltextSearchStore({
      adapter,
      primaryStore: {
        storeId: "primary",
        capabilities: { loads: true },
        typeNameToTypeIRI: () => "http://ex.org/Item",
      } as never,
      searchFacetSchema: sidecar,
      schema: schema as never,
      primaryFields: { Manifestation: { label: "fileName" } },
      indexNameForType: () => "file-metadata",
      existingIndexTypes: ["Manifestation"],
      adaptFiltersForLiveIndex: (filters) =>
        filters?.map((f) =>
          f.field === "legacySlot" ? { field: "kind", value: "a" } : f,
        ),
    });

    const result = await store.searchDocuments("Manifestation", "target", {
      limit: 10,
      filters: [{ field: "legacySlot", value: "x" }],
    });
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]?.fileName).toBe("target");
  });

  test("reports unavailableFacets without failing search", async () => {
    const adapter = createInMemoryTextIndexAdapter({ strictSchema: true });
    await adapter.ensureIndex("file-metadata", {
      primaryKey: "id",
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName", "__type"],
    });
    await adapter.addDocuments("file-metadata", [
      {
        id: "1",
        __iri: "http://ex/m/1",
        __type: "Manifestation",
        fileName: "a",
      },
    ]);

    const store = initFulltextSearchStore({
      adapter,
      primaryStore: {
        storeId: "primary",
        capabilities: { loads: true },
        typeNameToTypeIRI: () => "Manifestation",
      } as never,
      searchFacetSchema: sidecar,
      schema: schema as never,
      primaryFields: { Manifestation: { label: "fileName" } },
      indexNameForType: () => "file-metadata",
      existingIndexTypes: ["Manifestation"],
    });

    const result = await store.searchDocuments("Manifestation", "a", {
      limit: 5,
      facets: ["cameraModel"],
    });
    expect(result.unavailableFacets).toEqual(["cameraModel"]);
  });

  test("range filter uses numericField companion for probe", async () => {
    const adapter = createInMemoryTextIndexAdapter({ strictSchema: true });
    await adapter.ensureIndex("file-metadata", {
      primaryKey: "id",
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName"],
    });

    const store = initFulltextSearchStore({
      adapter,
      primaryStore: {
        storeId: "primary",
        capabilities: { loads: true },
        typeNameToTypeIRI: () => "Manifestation",
      } as never,
      searchFacetSchema: sidecar,
      schema: schema as never,
      primaryFields: { Manifestation: { label: "fileName" } },
      indexNameForType: () => "file-metadata",
      existingIndexTypes: ["Manifestation"],
    });

    await expect(
      store.searchDocuments("Manifestation", "", {
        limit: 5,
        filters: [{ field: "modificationTime", gte: 1000 }],
      }),
    ).rejects.toBeInstanceOf(IndexSchemaMismatchError);
  });

  test("cache shares one getIndexSettings call within TTL", async () => {
    let calls = 0;
    const base = createInMemoryTextIndexAdapter({ strictSchema: true });
    await base.ensureIndex("idx", {
      primaryKey: "id",
      searchableAttributes: ["fileName"],
      filterableAttributes: ["fileName"],
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
    await cache.get("idx");
    expect(calls).toBe(1);
  });
});
