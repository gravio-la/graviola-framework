/**
 * InverseMap contract (no x-inverseOf on schema) — SPARQL store paths only.
 */
import { describe, test, expect, beforeEach } from "bun:test";
import type { CRUDFunctions } from "@graviola/edb-core-types";
import datasetFactory from "@rdfjs/dataset";
import type { Quad } from "@rdfjs/types";
import type { JSONSchema7 } from "json-schema";
import { Store } from "oxigraph";
import { initSPARQLDatastorePair } from "@graviola/sparql-db-impl";

const BASE_IRI = "http://example.org/inverse-map/";
const typeNameToTypeIRI = (typeName: string) => `${BASE_IRI}${typeName}`;
const typeIRItoTypeName = (iri: string) => iri.replace(BASE_IRI, "");
const propertyToIRI = (property: string) => `${BASE_IRI}${property}`;

const categorySchema = {
  definitions: {
    Category: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        subCategories: {
          type: "array",
          items: { $ref: "#/definitions/Category" },
        },
        parentCategory: { $ref: "#/definitions/Category" },
      },
      required: ["name"],
    },
  },
} satisfies JSONSchema7;

const inverses = {
  Category: { subCategories: "Category.parentCategory" },
};

const TRIPLE_COUNT = "SELECT (COUNT(*) AS ?n) WHERE { ?s ?p ?o }";

function makeSyncStoreCRUDFunctions(oxi: Store): CRUDFunctions {
  return {
    askFetch: async (query: string) => Boolean(oxi.query(query)),
    constructFetch: async (query: string) =>
      datasetFactory.dataset((oxi.query(query) as Quad[]) ?? []),
    updateFetch: async (query: string) => {
      oxi.update(query);
    },
    selectFetch: (async (
      query: string,
      options?: { withHeaders?: boolean },
    ) => {
      const raw = oxi.query(query, {
        results_format: "application/sparql-results+json",
      }) as string;
      const parsed = JSON.parse(raw || "{}");
      return options?.withHeaders ? parsed : (parsed.results?.bindings ?? []);
    }) as CRUDFunctions["selectFetch"],
  };
}

function countTriples(store: Store): number {
  const raw = store.query(TRIPLE_COUNT, {
    results_format: "application/sparql-results+json",
  }) as string;
  const parsed = JSON.parse(raw || "{}");
  return Number(parsed.results?.bindings?.[0]?.n?.value ?? 0);
}

function hasTriple(store: Store, s: string, p: string, o: string): boolean {
  return Boolean(store.query(`ASK { <${s}> <${p}> <${o}> . }`));
}

describe("InverseMap SPARQL store (no x-inverseOf)", () => {
  let oxigraphStore: Store;

  beforeEach(() => {
    oxigraphStore = new Store();
  });

  function createPair() {
    return initSPARQLDatastorePair({
      schema: categorySchema as JSONSchema7,
      defaultPrefix: BASE_IRI,
      jsonldContext: { "@vocab": BASE_IRI },
      typeNameToTypeIRI,
      queryBuildOptions: {
        propertyToIRI,
        typeIRItoTypeName,
        primaryFields: { Category: { label: "name" } },
        primaryFieldExtracts: {},
        inverses,
        sparqlFlavour: "oxigraph",
      },
      walkerOptions: { maxRecursion: 4, maxRecursionEachRef: 4 },
      sparqlQueryFunctions: makeSyncStoreCRUDFunctions(oxigraphStore),
      defaultLimit: 100,
      enableInversePropertiesFeature: true,
    });
  }

  test("flat list, count, typed filter, and delete honor inverse map", async () => {
    const { store, abstractDatastore: ds } = createPair();
    const parentId = `${BASE_IRI}Category/parent`;
    const childId = `${BASE_IRI}Category/child`;

    await ds.upsertDocument("Category", childId, { name: "Child" });
    await ds.upsertDocument("Category", parentId, {
      name: "Parent",
      subCategories: [{ "@id": childId }],
    });

    expect(
      hasTriple(
        oxigraphStore,
        childId,
        propertyToIRI("parentCategory"),
        parentId,
      ),
    ).toBe(true);
    expect(
      hasTriple(
        oxigraphStore,
        parentId,
        propertyToIRI("subCategories"),
        childId,
      ),
    ).toBe(false);

    const flat = await ds.findDocumentsAsFlatResultSet("Category", {});
    expect(flat.results.bindings.length).toBe(2);

    const count = await ds.countDocuments("Category", {});
    expect(count).toBe(2);

    const filtered = await ds.filterTypedDocuments("Category", {
      where: {
        subCategories: { some: { "@id": childId } },
      },
    });
    expect(filtered.map((d) => (d as { "@id"?: string })["@id"])).toEqual([
      parentId,
    ]);

    const triplesBefore = countTriples(oxigraphStore);
    await ds.removeDocument("Category", parentId);
    const triplesAfter = countTriples(oxigraphStore);

    expect(triplesAfter).toBeLessThan(triplesBefore);
    expect(
      hasTriple(
        oxigraphStore,
        childId,
        propertyToIRI("parentCategory"),
        parentId,
      ),
    ).toBe(false);

    const childAfter = await ds.loadDocument("Category", childId);
    expect(childAfter?.parentCategory?.["@id"]).toBeUndefined();
  });
});
