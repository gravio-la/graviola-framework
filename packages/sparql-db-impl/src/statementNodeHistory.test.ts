import { describe, expect, test } from "bun:test";
import datasetFactory from "@rdfjs/dataset";
import type { Quad } from "@rdfjs/types";
import { Store } from "oxigraph";
import { initSPARQLDatastorePair } from "./initSPARQLStore";
import { sparqlMetaTestSchema } from "../../../apps/datastore-tests/src/schema/metaTestConfig";
import { sparqlStatementNodeMetaConfig } from "../../../apps/datastore-tests/src/schema/statementTestConfig";
import {
  entityIRI,
  queryBuildOptions,
  typeNameToTypeIRI,
} from "../../../apps/datastore-tests/src/schema/testSchema";
import { makeItem } from "../../../apps/datastore-tests/src/fixtures/testData";

const BASE_IRI = "http://example.org/test#";

function makeSyncStoreCRUDFunctions(store: Store) {
  return {
    askFetch: async (query: string) => Boolean(store.query(query)),
    constructFetch: async (query: string) => {
      const quads = (store.query(query) as Quad[]) ?? [];
      return datasetFactory.dataset(quads);
    },
    updateFetch: async (query: string) => {
      store.update(query);
    },
    selectFetch: (async (query: string) => {
      const raw = store.query(query, {
        results_format: "application/sparql-results+json",
      }) as string;
      const parsed = JSON.parse(raw || "{}");
      return parsed.results?.bindings ?? [];
    }) as Parameters<
      typeof initSPARQLDatastorePair
    >[0]["sparqlQueryFunctions"]["selectFetch"],
  };
}

function sampleWrite(value: number, source: string) {
  return {
    path: "price",
    value,
    statement: {
      rank: "preferred" as const,
      source,
      generatedAt: "2026-03-01T10:00:00.000Z",
      wasGeneratedBy: {
        formulaId: "test-formula",
        stratum: 1,
        inputFingerprint: `fp-${value}`,
        generatedAt: "2026-03-01T10:00:00.000Z",
      },
    },
  };
}

function sparqlCount(store: Store, query: string): number {
  const raw = store.query(query, {
    results_format: "application/sparql-results+json",
  }) as string;
  return Number(JSON.parse(raw).results.bindings[0].c.value);
}

describe("statement-node history", () => {
  test("four distinct writes yield four nodes and linear triple growth", async () => {
    const ox = new Store();
    const { store: sparqlStore } = initSPARQLDatastorePair({
      schema: sparqlMetaTestSchema as never,
      defaultPrefix: BASE_IRI,
      jsonldContext: { "@vocab": BASE_IRI },
      typeNameToTypeIRI,
      queryBuildOptions: { ...queryBuildOptions, sparqlFlavour: "oxigraph" },
      sparqlQueryFunctions: makeSyncStoreCRUDFunctions(ox),
      defaultLimit: 100,
      statementMeta: sparqlStatementNodeMetaConfig,
    });
    const store = sparqlStore as unknown as {
      upsert: (type: string, id: string, doc: unknown) => Promise<unknown>;
      writeStatements: (
        type: string,
        id: string,
        writes: unknown[],
      ) => Promise<void>;
      loadStatements: (
        type: string,
        id: string,
        paths: string[],
      ) => Promise<{ price?: Array<{ value: number }> }>;
    };

    const itemId = entityIRI("Item", "history-linear");
    await store.upsert("Item", itemId, makeItem("history-linear") as never);

    const tripleCounts: number[] = [];
    for (let i = 1; i <= 4; i++) {
      await store.writeStatements("Item", itemId, [
        sampleWrite(i * 10, `w${i}`),
      ]);
      tripleCounts.push(
        sparqlCount(ox, "SELECT (COUNT(*) AS ?c) WHERE { ?s ?p ?o }"),
      );
    }

    const rows = (await store.loadStatements("Item", itemId, ["price"])).price;
    expect(rows?.length).toBe(4);

    for (let i = 1; i < tripleCounts.length; i++) {
      const delta = tripleCounts[i]! - tripleCounts[i - 1]!;
      expect(delta).toBeGreaterThan(0);
      expect(delta).toBeLessThanOrEqual(
        tripleCounts[1]! - tripleCounts[0]! + 2,
      );
    }
  });

  test("no orphaned blank-node statement subgraphs after repeated writes", async () => {
    const ox = new Store();
    const { store: sparqlStore } = initSPARQLDatastorePair({
      schema: sparqlMetaTestSchema as never,
      defaultPrefix: BASE_IRI,
      jsonldContext: { "@vocab": BASE_IRI },
      typeNameToTypeIRI,
      queryBuildOptions: { ...queryBuildOptions, sparqlFlavour: "oxigraph" },
      sparqlQueryFunctions: makeSyncStoreCRUDFunctions(ox),
      defaultLimit: 100,
      statementMeta: sparqlStatementNodeMetaConfig,
    });
    const store = sparqlStore as unknown as {
      upsert: (type: string, id: string, doc: unknown) => Promise<unknown>;
      writeStatements: (
        type: string,
        id: string,
        writes: unknown[],
      ) => Promise<void>;
    };

    const itemId = entityIRI("Item", "history-orphans");
    await store.upsert("Item", itemId, makeItem("history-orphans") as never);

    for (let i = 1; i <= 4; i++) {
      await store.writeStatements("Item", itemId, [
        sampleWrite(i * 10, `w${i}`),
      ]);
    }

    const orphans = sparqlCount(
      ox,
      `SELECT (COUNT(DISTINCT ?b) AS ?c) WHERE {
        ?b ?p ?o .
        FILTER(isBlank(?b))
        FILTER NOT EXISTS { ?e ?sp ?b }
      }`,
    );
    expect(orphans).toBe(0);
  });
});
