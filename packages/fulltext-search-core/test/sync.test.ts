import { describe, expect, test } from "bun:test";
import { loadSearchFacetSchema } from "@graviola/search-facet-schema";
import { createChangeBus } from "@graviola/store-core";

import {
  createInMemoryTextIndexAdapter,
  encodeIriToDocId,
  initFulltextSearchStore,
  prepareFulltextIndexes,
} from "../src/index";

describe("change-bus fulltext index sync", () => {
  const typeIri = (t: string) => `http://ex.org/${t}`;
  const artistSidecar = loadSearchFacetSchema({
    fulltextIndex: {
      scopes: { "#/definitions/Artist/properties/name": {} },
      types: { Artist: { searchable: true } },
    },
  });
  const primaryFields = { Artist: { label: "name" } };

  function makePrimary() {
    const bus = createChangeBus();
    const docs = new Map<string, Record<string, unknown>>();
    return {
      storeId: "mock-primary",
      capabilities: {
        identifies: true as const,
        loads: true as const,
        searches: true as const,
      },
      typeNameToTypeIRI: typeIri,
      typeIRItoTypeName: (iri: string) => iri.split("/").pop() ?? iri,
      loadOne: async (_type: string, iri: string) => docs.get(iri) ?? null,
      subscribe: bus.subscribe,
      emit: bus.emit,
      docs,
      upsert(
        typeName: string,
        entityIRI: string,
        document: Record<string, unknown>,
      ) {
        docs.set(entityIRI, { ...document, "@id": entityIRI });
        bus.emit({
          changeType: "upsert",
          typeName: typeName as "Artist",
          typeIRI: typeIri(typeName),
          entityIRI,
          data: docs.get(entityIRI),
        });
      },
      remove(typeName: string, entityIRI: string) {
        docs.delete(entityIRI);
        bus.emit({
          changeType: "remove",
          typeName: typeName as "Artist",
          typeIRI: typeIri(typeName),
          entityIRI,
        });
      },
    };
  }

  test("upsert of searchable type updates the index", async () => {
    const adapter = createInMemoryTextIndexAdapter();
    await prepareFulltextIndexes({
      adapter,
      searchFacetSchema: artistSidecar,
      primaryFields,
    });
    const primary = makePrimary();
    const store = initFulltextSearchStore({
      adapter,
      primaryStore: primary as never,
      searchFacetSchema: artistSidecar,
      schema: {},
      primaryFields,
    });

    const iri = "http://ex.org/a/1";
    primary.upsert("Artist", iri, {
      "@id": iri,
      "@type": typeIri("Artist"),
      name: "Monet",
    });
    await store.flushFulltextIndexSync();

    const hit = await store.searchDocuments("Artist", "Monet");
    expect(hit.documents).toHaveLength(1);
    expect(hit.documents[0]?.["@id"]).toBe(iri);

    primary.upsert("Artist", iri, {
      "@id": iri,
      "@type": typeIri("Artist"),
      name: "Renoir",
    });
    await store.flushFulltextIndexSync();

    expect(
      (await store.searchDocuments("Artist", "Renoir")).documents,
    ).toHaveLength(1);
    expect(
      (await store.searchDocuments("Artist", "Monet")).documents,
    ).toHaveLength(0);

    store.unsubscribeFulltextIndexSync();
  });

  test("remove of searchable type deletes the index document", async () => {
    const adapter = createInMemoryTextIndexAdapter();
    await prepareFulltextIndexes({
      adapter,
      searchFacetSchema: artistSidecar,
      primaryFields,
    });
    const primary = makePrimary();
    const store = initFulltextSearchStore({
      adapter,
      primaryStore: primary as never,
      searchFacetSchema: artistSidecar,
      schema: {},
      primaryFields,
    });

    const iri = "http://ex.org/a/2";
    primary.upsert("Artist", iri, {
      "@id": iri,
      "@type": typeIri("Artist"),
      name: "Manet",
    });
    await store.flushFulltextIndexSync();
    expect(
      (await store.searchDocuments("Artist", "Manet")).documents,
    ).toHaveLength(1);

    primary.remove("Artist", iri);
    await store.flushFulltextIndexSync();

    expect(
      (await store.searchDocuments("Artist", "Manet")).documents,
    ).toHaveLength(0);
    expect(
      adapter.getIndex("Artist").find((d) => d.id === encodeIriToDocId(iri)),
    ).toBeUndefined();

    store.unsubscribeFulltextIndexSync();
  });

  test("non-searchable type is ignored", async () => {
    const adapter = createInMemoryTextIndexAdapter();
    await prepareFulltextIndexes({
      adapter,
      searchFacetSchema: artistSidecar,
      primaryFields,
    });
    const primary = makePrimary();
    const store = initFulltextSearchStore({
      adapter,
      primaryStore: primary as never,
      searchFacetSchema: artistSidecar,
      schema: {},
      primaryFields,
    });

    const iri = "http://ex.org/c/1";
    primary.upsert("Curator", iri, {
      "@id": iri,
      "@type": typeIri("Curator"),
      name: "Jane",
    });
    await store.flushFulltextIndexSync();

    // Artist index untouched; Curator has no searchable routing
    expect(adapter.getIndex("Artist")).toHaveLength(0);
    store.unsubscribeFulltextIndexSync();
  });
});
