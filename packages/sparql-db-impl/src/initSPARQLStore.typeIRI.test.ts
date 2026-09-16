/**
 * Regression: class IRIs outside defaultPrefix (@vocab / entityBaseIRI) must reverse-map
 * via queryBuildOptions.typeIRItoTypeName, not iri.replace(defaultPrefix, "").
 */
import { describe, test, expect } from "bun:test";
import type { CRUDFunctions } from "@graviola/edb-core-types";
import datasetFactory from "@rdfjs/dataset";
import type { Quad } from "@rdfjs/types";
import type { JSONSchema7 } from "json-schema";
import { Store } from "oxigraph";

import { initSPARQLStore } from "./initSPARQLStore";

const ENTITY_BASE = "https://graviola.gra.one/exhibition-demo/entity/";
const CLASS_IRI = "https://graviola.gra.one/exhibition-demo/Person";
const ENTITY_IRI = `${ENTITY_BASE}Person/test-uuid`;

const schema = {
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string", const: CLASS_IRI },
        name: { type: "string" },
      },
      required: ["name"],
    },
  },
} satisfies JSONSchema7;

const typeNameToTypeIRI = (name: string) =>
  name === "Person" ? CLASS_IRI : `${ENTITY_BASE}${name}`;
const typeIRItoTypeName = (iri: string) =>
  iri === CLASS_IRI ? "Person" : iri.replace(ENTITY_BASE, "");

function makeSyncStoreCRUDFunctions(oxi: Store): CRUDFunctions {
  return {
    askFetch: async (query: string) => Boolean(oxi.query(query)),
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

describe("initSPARQLStore typeIRItoTypeName", () => {
  test("uses queryBuildOptions.typeIRItoTypeName when class IRI is outside defaultPrefix", async () => {
    const oxi = new Store();

    const store = initSPARQLStore({
      schema,
      defaultPrefix: ENTITY_BASE,
      jsonldContext: { "@vocab": ENTITY_BASE },
      typeNameToTypeIRI,
      queryBuildOptions: {
        typeIRItoTypeName,
        primaryFields: { Person: { label: "name" } },
        primaryFieldExtracts: {},
        propertyToIRI: (prop: string) => `${ENTITY_BASE}${prop}`,
      },
      sparqlQueryFunctions: makeSyncStoreCRUDFunctions(oxi),
      defaultLimit: 50,
    });

    expect(store.typeIRItoTypeName(CLASS_IRI)).toBe("Person");
    // Old replace(defaultPrefix) left the full class IRI unchanged (regression).
    expect(CLASS_IRI.replace(ENTITY_BASE, "")).toBe(CLASS_IRI);
  });
});
