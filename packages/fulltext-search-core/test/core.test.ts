import { describe, expect, test } from "bun:test";
import { loadSearchFacetSchema } from "@graviola/search-facet-schema";
import {
  buildRoutingPolicy,
  createManifestationHexIdCodec,
  decodeDocIdToIri,
  encodeIriToDocId,
  getTypeRouting,
  hitToJsonLd,
  initFulltextSearchStore,
  prepareFulltextIndexes,
  projectEntityToIndexDoc,
  createInMemoryTextIndexAdapter,
} from "../src/index";

const ENTITY_NS = "http://semanticdesk.top/entity#";

const sidecar = loadSearchFacetSchema({
  fulltextIndex: {
    scopes: {
      "#/definitions/Exhibition/properties/title": {},
      "#/definitions/Artist/properties/name": { weight: 2 },
    },
    types: {
      Place: { searchable: true },
    },
  },
  facets: {
    scopes: {
      "#/definitions/Exhibition/properties/venue": { facet: "filter" },
      "#/definitions/Exhibition/properties/year": { facet: "range" },
    },
  },
});

const primaryFields = {
  Place: { label: "placeName", description: "description" },
  Exhibition: { label: "title" },
};

describe("id-mapping", () => {
  test("round-trips IRIs", () => {
    const iri = "http://example.org/entity/exhibition/1";
    expect(decodeDocIdToIri(encodeIriToDocId(iri))).toBe(iri);
  });

  test("manifestation hex codec maps legacy indexer ids", () => {
    const codec = createManifestationHexIdCodec(ENTITY_NS);
    const hex =
      "abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const iri = `${ENTITY_NS}manifestation/${hex}`;
    expect(codec.decodeDocIdToIri(hex)).toBe(iri);
    expect(codec.encodeIriToDocId(iri)).toBe(hex);
  });
});

describe("buildRoutingPolicy", () => {
  test("groups scopes per type", () => {
    const policy = buildRoutingPolicy({
      sidecar,
      primaryFields,
    });
    const exhibition = getTypeRouting(policy, "Exhibition");
    expect(exhibition?.fulltextFields).toContain("title");
    expect(exhibition?.facetFields.map((f) => f.field)).toContain("venue");
  });

  test("convention fallback uses primaryFields label+description", () => {
    const policy = buildRoutingPolicy({ sidecar, primaryFields });
    const place = getTypeRouting(policy, "Place");
    expect(place?.searchable).toBe(true);
    expect(place?.fulltextFields).toEqual(["placeName", "description"]);
  });
});

describe("hitToJsonLd", () => {
  test("produces @id and @type from carriers", () => {
    const policy = buildRoutingPolicy({ sidecar, primaryFields });
    const routing = getTypeRouting(policy, "Exhibition")!;
    const jsonld = hitToJsonLd(
      {
        id: "x",
        document: {
          id: "x",
          __iri: "http://ex.org/e/1",
          __type: "http://ex.org/Exhibition",
          title: "Modern Art",
        },
      },
      routing,
      { typeIri: "http://ex.org/Exhibition" },
    );
    expect(jsonld["@id"]).toBe("http://ex.org/e/1");
    expect(jsonld["@type"]).toBe("http://ex.org/Exhibition");
    expect(jsonld.title).toBe("Modern Art");
  });
});

describe("initFulltextSearchStore with in-memory adapter", () => {
  test("searchDocuments returns JSON-LD stubs", async () => {
    const adapter = createInMemoryTextIndexAdapter();
    await prepareFulltextIndexes({
      adapter,
      searchFacetSchema: sidecar,
      primaryFields,
    });

    const typeIri = "http://ex.org/Exhibition";
    const routing = buildRoutingPolicy({ sidecar, primaryFields });
    const exRouting = getTypeRouting(routing, "Exhibition")!;

    await adapter.addDocuments(exRouting.indexUid, [
      projectEntityToIndexDoc(
        {
          "@id": "http://ex.org/e/1",
          "@type": typeIri,
          title: "Summer Show",
          venue: "Gallery A",
        },
        exRouting,
        { typeIri },
      ),
    ]);

    const primary = {
      storeId: "mock",
      capabilities: { identifies: true, loads: true, searches: true },
      typeNameToTypeIRI: () => typeIri,
      typeIRItoTypeName: () => "Exhibition",
      loadOne: async () => null,
      findEntityByTypeName: async () => [],
    };

    const store = initFulltextSearchStore({
      adapter,
      primaryStore: primary,
      searchFacetSchema: sidecar,
      schema: {},
      primaryFields,
    });

    const result = await store.searchDocuments("Exhibition", "Summer");
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]?.["@id"]).toBe("http://ex.org/e/1");
    expect(result.documents[0]?.["@type"]).toBe(typeIri);
    expect(result.documents[0]?.title).toBe("Summer Show");
  });

  test("legacy hex document ids decode to manifestation IRIs", async () => {
    const adapter = createInMemoryTextIndexAdapter();
    const manifestSidecar = loadSearchFacetSchema({
      fulltextIndex: {
        scopes: {
          "#/definitions/Manifestation/properties/fileName": {},
          "#/definitions/Manifestation/properties/filePath": {},
        },
      },
    });
    await prepareFulltextIndexes({
      adapter,
      searchFacetSchema: manifestSidecar,
      primaryFields: { Manifestation: { label: "fileName" } },
      existingIndexTypes: ["Manifestation"],
    });

    const typeIri = `${ENTITY_NS}Manifestation`;
    const hex =
      "d03ab43343cb0d401234567890abcdef1234567890abcdef1234567890abcd";
    const legacyIndex = "file-metadata";

    await adapter.ensureIndex(legacyIndex, {
      searchableAttributes: ["fileName", "filePath"],
      filterableAttributes: [],
    });
    await adapter.addDocuments(legacyIndex, [
      {
        id: hex,
        fileName: "AlbumArtSmall.jpg",
        filePath: "/data/music/AlbumArtSmall.jpg",
      },
    ]);

    const primary = {
      storeId: "mock",
      capabilities: { identifies: true, loads: true, searches: true },
      typeNameToTypeIRI: () => typeIri,
      typeIRItoTypeName: () => "Manifestation",
      loadOne: async () => null,
    };

    const store = initFulltextSearchStore({
      adapter,
      primaryStore: primary,
      searchFacetSchema: manifestSidecar,
      schema: {},
      primaryFields: { Manifestation: { label: "fileName" } },
      indexNameForType: (t) => (t === "Manifestation" ? legacyIndex : t),
      idCodec: createManifestationHexIdCodec(ENTITY_NS),
      existingIndexTypes: ["Manifestation"],
    });

    const result = await store.searchDocuments("Manifestation", "AlbumArt");
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]?.["@id"]).toBe(
      `${ENTITY_NS}manifestation/${hex}`,
    );
    expect(result.documents[0]?.fileName).toBe("AlbumArtSmall.jpg");
  });

  test("hydrate merges primary store document", async () => {
    const adapter = createInMemoryTextIndexAdapter();
    await prepareFulltextIndexes({
      adapter,
      searchFacetSchema: sidecar,
      primaryFields,
    });

    const typeIri = "http://ex.org/Artist";
    const artistSidecar = loadSearchFacetSchema({
      fulltextIndex: {
        scopes: { "#/definitions/Artist/properties/name": {} },
      },
    });
    const routing = buildRoutingPolicy({
      sidecar: artistSidecar,
      primaryFields,
    });
    const artistRouting = getTypeRouting(routing, "Artist")!;

    await adapter.ensureIndex(artistRouting.indexUid, {
      searchableAttributes: ["name"],
      filterableAttributes: [],
    });
    await adapter.addDocuments(artistRouting.indexUid, [
      projectEntityToIndexDoc(
        { "@id": "http://ex.org/a/1", "@type": typeIri, name: "Monet" },
        artistRouting,
        { typeIri },
      ),
    ]);

    const primary = {
      storeId: "mock",
      capabilities: { identifies: true, loads: true },
      typeNameToTypeIRI: () => typeIri,
      typeIRItoTypeName: () => "Artist",
      loadOne: async () => ({
        "@id": "http://ex.org/a/1",
        "@type": typeIri,
        name: "Monet",
        birthYear: 1840,
      }),
    };

    const store = initFulltextSearchStore({
      adapter,
      primaryStore: primary,
      searchFacetSchema: artistSidecar,
      schema: {},
      primaryFields,
    });

    const result = await store.searchDocuments("Artist", "Monet", {
      hydrate: true,
    });
    expect(result.documents[0]?.birthYear).toBe(1840);
  });

  test("non-FT type falls back to findEntityByTypeName", async () => {
    const adapter = createInMemoryTextIndexAdapter();
    const primary = {
      storeId: "mock",
      capabilities: { identifies: true, searches: true },
      typeNameToTypeIRI: (t: string) => `http://ex.org/${t}`,
      typeIRItoTypeName: () => "Curator",
      findEntityByTypeName: async () => [
        {
          entityIRI: "http://ex.org/c/1",
          typeIRI: "http://ex.org/Curator",
          value: "Jane",
          label: "Jane",
        },
      ],
    };

    const store = initFulltextSearchStore({
      adapter,
      primaryStore: primary,
      searchFacetSchema: loadSearchFacetSchema({}),
      schema: {},
      primaryFields: {},
    });

    const hits = await store.searchText("Curator", "Jane");
    expect(hits[0]?.iri).toBe("http://ex.org/c/1");
  });
});
