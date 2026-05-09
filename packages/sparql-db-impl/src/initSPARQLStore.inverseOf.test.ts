/**
 * Regression: parent-side edits to x-inverseOf arrays must sync canonical triples
 * (e.g. child :parentCategory parent) and must not persist orphan forward :subCategories triples.
 */
import { describe, test, expect, beforeEach } from "bun:test";
import type { CRUDFunctions } from "@graviola/edb-core-types";
import datasetFactory from "@rdfjs/dataset";
import type { Quad } from "@rdfjs/types";
import type { JSONSchema7 } from "json-schema";
import { Store } from "oxigraph";

import { initSPARQLStore } from "./initSPARQLStore";

const BASE_IRI = "http://example.org/test/";
const typeNameToTypeIRI = (typeName: string): string =>
  `${BASE_IRI}${typeName}`;
const typeIRItoTypeName = (iri: string): string => iri.replace(BASE_IRI, "");
const propertyToIRI = (property: string): string => `${BASE_IRI}${property}`;

const inverseCategorySchema = {
  definitions: {
    Category: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": {
          type: "string",
          const: `${BASE_IRI}Category`,
        },
        name: { type: "string" },
        subCategories: {
          type: "array",
          items: { $ref: "#/definitions/Category" },
          "x-inverseOf": {
            inverseOf: ["#/definitions/Category/properties/parentCategory"],
          },
        },
        parentCategory: { $ref: "#/definitions/Category" },
      },
      required: ["name"],
    },
  },
} satisfies JSONSchema7;

function makeSyncStoreCRUDFunctions(oxi: Store): CRUDFunctions {
  return {
    askFetch: async (query: string): Promise<boolean> => {
      return Boolean(oxi.query(query));
    },

    constructFetch: async (query: string) => {
      const quads = (oxi.query(query) as Quad[]) ?? [];
      return datasetFactory.dataset(quads);
    },

    updateFetch: async (query: string) => {
      oxi.update(query);
    },

    selectFetch: ((query: string, options?: { withHeaders?: boolean }) => {
      const raw = oxi.query(query, {
        results_format: "application/sparql-results+json",
      }) as string;
      const parsed = JSON.parse(raw || "{}");
      return Promise.resolve(
        options?.withHeaders ? parsed : (parsed.results?.bindings ?? []),
      );
    }) as CRUDFunctions["selectFetch"],
  };
}

function ask(store: Store, q: string): boolean {
  return Boolean(store.query(q));
}

function hasParentCategoryLink(
  store: Store,
  childId: string,
  parentId: string,
): boolean {
  return ask(
    store,
    `ASK { <${childId}> <${propertyToIRI("parentCategory")}> <${parentId}> . }`,
  );
}

describe("initSPARQLStore x-inverseOf", () => {
  let oxigraphStore: Store;

  beforeEach(() => {
    oxigraphStore = new Store();
  });

  function createDatastore(enableInversePropertiesFeature: boolean) {
    return initSPARQLStore({
      schema: inverseCategorySchema as JSONSchema7,
      defaultPrefix: BASE_IRI,
      jsonldContext: { "@vocab": BASE_IRI },
      typeNameToTypeIRI,
      queryBuildOptions: {
        propertyToIRI,
        typeIRItoTypeName,
        primaryFields: {
          Category: { label: "name", description: "description" },
        },
        primaryFieldExtracts: {},
      },
      walkerOptions: {
        maxRecursion: 4,
        maxRecursionEachRef: 4,
      },
      sparqlQueryFunctions: makeSyncStoreCRUDFunctions(oxigraphStore),
      defaultLimit: 100,
      enableInversePropertiesFeature,
    });
  }

  test("syncs parentCategory when editing subCategories from parent (inverse feature on)", async () => {
    const ds = createDatastore(true);
    const parentId = `${BASE_IRI}Category/parent1`;
    const childId = `${BASE_IRI}Category/child1`;

    await ds.upsertDocument("Category", childId, {
      name: "Child",
    });

    await ds.upsertDocument("Category", parentId, {
      name: "Parent",
      subCategories: [{ "@id": childId }],
    });

    const child = await ds.loadDocument("Category", childId);
    expect(hasParentCategoryLink(oxigraphStore, childId, parentId)).toBe(true);
    expect(child?.parentCategory?.["@id"]).toBe(parentId);

    const parent = await ds.loadDocument("Category", parentId);
    expect(
      parent?.subCategories?.map((c: { "@id": string }) => c["@id"]),
    ).toEqual([childId]);

    const forwardAsk = `ASK { <${parentId}> <${propertyToIRI("subCategories")}> ?o . }`;
    expect(ask(oxigraphStore, forwardAsk)).toBe(false);
  });

  test("clears parentCategory when parent removes subcategory (inverse feature on)", async () => {
    const ds = createDatastore(true);
    const parentId = `${BASE_IRI}Category/parent2`;
    const childId = `${BASE_IRI}Category/child2`;

    await ds.upsertDocument("Category", childId, { name: "Child" });
    await ds.upsertDocument("Category", parentId, {
      name: "Parent",
      subCategories: [{ "@id": childId }],
    });

    await ds.upsertDocument("Category", parentId, {
      name: "Parent",
      subCategories: [],
    });

    const child = await ds.loadDocument("Category", childId);
    // Canonical link must be gone (ASK). Loader may still emit an empty nested shell without @id.
    expect(hasParentCategoryLink(oxigraphStore, childId, parentId)).toBe(false);
    expect(child?.parentCategory?.["@id"]).toBeUndefined();

    const forwardAsk = `ASK { <${parentId}> <${propertyToIRI("subCategories")}> ?o . }`;
    expect(ask(oxigraphStore, forwardAsk)).toBe(false);
  });

  test("without inverse feature, parent-side subCategories edit does not set parentCategory on child", async () => {
    const ds = createDatastore(false);
    const parentId = `${BASE_IRI}Category/parent3`;
    const childId = `${BASE_IRI}Category/child3`;

    await ds.upsertDocument("Category", childId, { name: "Child" });
    await ds.upsertDocument("Category", parentId, {
      name: "Parent",
      subCategories: [{ "@id": childId }],
    });

    const child = await ds.loadDocument("Category", childId);
    expect(hasParentCategoryLink(oxigraphStore, childId, parentId)).toBe(false);
    expect(child?.parentCategory?.["@id"]).toBeUndefined();

    const forwardAsk = `ASK { <${parentId}> <${propertyToIRI("subCategories")}> ?o . }`;
    expect(ask(oxigraphStore, forwardAsk)).toBe(false);
  });
});
