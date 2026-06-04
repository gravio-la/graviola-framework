import { describe, expect, test } from "bun:test";
import { hasCapability } from "@graviola/store-core";
import { loadSearchFacetSchema } from "@graviola/search-facet-schema";
import { encodeIriToDocId } from "@graviola/fulltext-search-core";
import {
  createMeilisearchAdapter,
  initMeilisearchSparqlStore,
  renderMeiliFilter,
} from "../src/index";
import type { PrimaryStore } from "@graviola/fulltext-search-core";

const sidecar = loadSearchFacetSchema({
  fulltextIndex: {
    scopes: {
      "#/definitions/Manifestation/properties/fileName": {},
    },
  },
  facets: {
    scopes: {
      "#/definitions/Manifestation/properties/mimeType": { facet: "filter" },
    },
  },
});

function createMockPrimaryStore(): PrimaryStore {
  return {
    storeId: "mock-sparql",
    capabilities: {
      identifies: true,
      loads: true,
      lists: true,
      writes: true,
    },
    typeNameToTypeIRI: (typeName) =>
      `http://semanticdesk.top/ontology#${typeName}`,
    typeIRItoTypeName: () => "Manifestation",
    loadOne: async (_typeName, iri) => ({
      "@id": iri,
      "@type": "http://semanticdesk.top/ontology#Manifestation",
      fileName: "from-primary.jpg",
    }),
  };
}

describe("renderMeiliFilter", () => {
  test("renders equality and range filters", () => {
    expect(
      renderMeiliFilter([{ field: "mimeType", value: "image/jpeg" }]),
    ).toBe('mimeType = "image/jpeg"');
    expect(
      renderMeiliFilter([{ field: "sizeBytes", gte: 100, lte: 500 }]),
    ).toBe("sizeBytes >= 100 AND sizeBytes <= 500");
  });
});

describe("initMeilisearchSparqlStore", () => {
  test("exposes merged capabilities and primary passthrough", () => {
    const primary = createMockPrimaryStore();
    const store = initMeilisearchSparqlStore({
      primaryStore: primary,
      meilisearch: {
        baseUrl: "http://localhost:7700",
        index: "Manifestation",
      },
      legacySingleIndex: "file-metadata",
      schema: {},
      primaryFields: { Manifestation: { label: "fileName" } },
      searchFacetSchema: sidecar,
    });

    expect(store.capabilities.textSearches).toBe(true);
    expect(store.capabilities.imports).toBe(true);
    expect(store.capabilities.loads).toBe(true);
    expect(hasCapability(store, "textSearches")).toBe(true);
    expect(store.routing.types.has("Manifestation")).toBe(true);
  });

  test("searchText maps hit id to entity IRI", async () => {
    const iri = "http://semanticdesk.top/entity#manifestation/abc123";
    const docId = encodeIriToDocId(iri);

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/indexes/") && url.endsWith("/search")) {
        return new Response(
          JSON.stringify({
            hits: [
              {
                id: docId,
                __iri: iri,
                __type: "http://semanticdesk.top/ontology#Manifestation",
                fileName: "photo.jpg",
              },
            ],
            estimatedTotalHits: 1,
            query: "photo",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;

    const store = initMeilisearchSparqlStore({
      primaryStore: createMockPrimaryStore(),
      meilisearch: {
        baseUrl: "http://localhost:7700",
        index: "Manifestation",
      },
      schema: {},
      primaryFields: { Manifestation: { label: "fileName" } },
      searchFacetSchema: sidecar,
    });

    const hits = await store.searchText("Manifestation", "photo", {
      limit: 10,
    });
    expect(hits).toHaveLength(1);
    expect(hits[0]?.iri).toBe(iri);
  });

  test("searchDocuments returns JSON-LD", async () => {
    const iri = "http://example.org/m/1";
    const docId = encodeIriToDocId(iri);

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/search")) {
        return new Response(
          JSON.stringify({
            hits: [
              {
                id: docId,
                __iri: iri,
                __type: "http://semanticdesk.top/ontology#Manifestation",
                fileName: "a.jpg",
              },
            ],
            query: "a",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;

    const store = initMeilisearchSparqlStore({
      primaryStore: createMockPrimaryStore(),
      meilisearch: { baseUrl: "http://localhost:7700", index: "Manifestation" },
      schema: {},
      primaryFields: { Manifestation: { label: "fileName" } },
      searchFacetSchema: sidecar,
    });

    const result = await store.searchDocuments("Manifestation", "a");
    expect(result.documents[0]?.["@id"]).toBe(iri);
    expect(result.documents[0]?.fileName).toBe("a.jpg");
  });
});

describe("createMeilisearchAdapter", () => {
  test("ensureIndex creates index and patches settings", async () => {
    const calls: { url: string; method: string; body?: unknown }[] = [];

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url = String(input);
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      if (url.endsWith("/indexes/Exhibition") && init?.method === "GET") {
        return new Response("", { status: 404 });
      }
      if (url.endsWith("/indexes") && init?.method === "POST") {
        return new Response(JSON.stringify({ taskUid: 1 }), { status: 202 });
      }
      if (url.includes("/tasks/1")) {
        return new Response(JSON.stringify({ status: "succeeded" }), {
          status: 200,
        });
      }
      if (url.includes("/settings") && init?.method === "PATCH") {
        return new Response(JSON.stringify({ taskUid: 2 }), { status: 202 });
      }
      if (url.includes("/tasks/2")) {
        return new Response(JSON.stringify({ status: "succeeded" }), {
          status: 200,
        });
      }
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    const adapter = createMeilisearchAdapter({
      baseUrl: "http://localhost:7700",
    });
    await adapter.ensureIndex("Exhibition", {
      searchableAttributes: ["title"],
      filterableAttributes: ["year"],
    });

    expect(
      calls.some((c) => c.method === "POST" && c.url.endsWith("/indexes")),
    ).toBe(true);
    expect(
      calls.some(
        (c) =>
          c.method === "PATCH" &&
          (
            c.body as { searchableAttributes?: string[] }
          )?.searchableAttributes?.includes("title"),
      ),
    ).toBe(true);
  });
});
