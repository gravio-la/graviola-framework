/**
 * Smoke tests for the new {@link SparqlStore} surface (vs legacy AbstractDatastore).
 */
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import type { SparqlStore } from "@graviola/store-core";
import { Store } from "oxigraph";
import datasetFactory from "@rdfjs/dataset";
import type { Quad } from "@rdfjs/types";
import type { CRUDFunctions } from "@graviola/edb-core-types";

import {
  rawTestSchema,
  typeNameToTypeIRI,
  queryBuildOptions,
  BASE_IRI,
} from "./schema/testSchema";
import { entityIRI } from "./schema/testSchema";
import { makeCategory } from "./fixtures/testData";

function makeSyncStoreCRUDFunctions(store: Store): CRUDFunctions {
  return {
    askFetch: async (query: string): Promise<boolean> => {
      return Boolean(store.query(query));
    },
    constructFetch: async (query: string) => {
      const quads = (store.query(query) as Quad[]) ?? [];
      return datasetFactory.dataset(quads);
    },
    updateFetch: async (query: string) => {
      store.update(query);
    },
    selectFetch: ((query: string, options?: { withHeaders?: boolean }) => {
      const raw = store.query(query, {
        results_format: "application/sparql-results+json",
      }) as string;
      const parsed = JSON.parse(raw || "{}");
      return Promise.resolve(
        options?.withHeaders ? parsed : (parsed.results?.bindings ?? []),
      );
    }) as CRUDFunctions["selectFetch"],
  };
}

describe("SPARQL Store API (initSPARQLStore)", () => {
  let ox: Store;
  let store: SparqlStore<Record<string, unknown>>;

  beforeAll(async () => {
    ox = new Store();
    store = initSPARQLStore({
      schema: rawTestSchema as any,
      defaultPrefix: BASE_IRI,
      jsonldContext: { "@vocab": BASE_IRI },
      typeNameToTypeIRI,
      queryBuildOptions,
      sparqlQueryFunctions: makeSyncStoreCRUDFunctions(ox),
      defaultLimit: 100,
    });
  });

  afterAll(() => {
    ox.update("CLEAR ALL");
  });

  beforeEach(() => {
    ox.update("CLEAR ALL");
  });

  test("loadOne + upsert round-trip", async () => {
    const id = entityIRI("Category", "store-api-1");
    await store.upsert("Category", id, makeCategory("store-api-1") as any);
    const doc = await store.loadOne("Category", id);
    expect(doc?.["@id"]).toBe(id);
  });

  test("capabilities.identifies", () => {
    expect(store.capabilities.identifies).toBe(true);
    expect(store.capabilities.loads).toBe(true);
    expect(store.capabilities.flatResultSet).toBe(true);
  });

  test("optional flat-result capability is exposed on Store", async () => {
    const id = entityIRI("Category", "store-api-flat-1");
    await store.upsert("Category", id, makeCategory("store-api-flat-1") as any);
    const resultSet = await store.findDocumentsAsFlatResultSet(
      "Category",
      {},
      10,
    );
    expect(Array.isArray(resultSet?.results?.bindings)).toBe(true);
    expect(resultSet.results.bindings.length).toBeGreaterThan(0);
  });
});
