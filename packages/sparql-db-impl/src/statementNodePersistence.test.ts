import { describe, expect, test } from "bun:test";
import datasetFactory from "@rdfjs/dataset";
import type { Quad } from "@rdfjs/types";
import type { JSONSchema7 } from "json-schema";
import { Store } from "oxigraph";

import { sparqlMetaTestSchema } from "../../../apps/datastore-tests/src/schema/metaTestConfig";
import { sparqlStatementNodeMetaConfig } from "../../../apps/datastore-tests/src/schema/statementTestConfig";
import {
  entityIRI,
  queryBuildOptions,
  typeNameToTypeIRI,
} from "../../../apps/datastore-tests/src/schema/testSchema";
import { makeItem } from "../../../apps/datastore-tests/src/fixtures/testData";
import { initSPARQLDatastorePair } from "./initSPARQLStore";

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

type StatementStore = {
  upsert: (type: string, id: string, doc: unknown) => Promise<unknown>;
  loadOne: (
    type: string,
    id: string,
  ) => Promise<Record<string, unknown> | null>;
  remove: (type: string, id: string) => Promise<unknown>;
  writeStatements: (
    type: string,
    id: string,
    writes: unknown[],
  ) => Promise<void>;
  loadStatements: (
    type: string,
    id: string,
    paths?: string[],
  ) => Promise<Record<string, Array<Record<string, unknown>>>>;
};

function makeStore(
  ox: Store,
  config: Record<string, unknown> = {},
): StatementStore {
  const { store } = initSPARQLDatastorePair({
    schema: sparqlMetaTestSchema as never,
    defaultPrefix: BASE_IRI,
    jsonldContext: { "@vocab": BASE_IRI },
    typeNameToTypeIRI,
    queryBuildOptions: { ...queryBuildOptions, sparqlFlavour: "oxigraph" },
    sparqlQueryFunctions: makeSyncStoreCRUDFunctions(ox),
    defaultLimit: 100,
    statementMeta: sparqlStatementNodeMetaConfig,
    ...config,
  } as never);
  return store as unknown as StatementStore;
}

function sparqlCount(store: Store, query: string): number {
  const raw = store.query(query, {
    results_format: "application/sparql-results+json",
  }) as string;
  return Number(JSON.parse(raw).results.bindings[0].c.value);
}

function countStore(store: Store) {
  return {
    triples: sparqlCount(store, "SELECT (COUNT(*) AS ?c) WHERE { ?s ?p ?o }"),
    blankNodes: sparqlCount(
      store,
      `SELECT (COUNT(DISTINCT ?b) AS ?c) WHERE {
        { ?b ?p ?o } UNION { ?s ?p ?b }
        FILTER(isBlank(?b))
      }`,
    ),
    orphans: sparqlCount(
      store,
      `SELECT (COUNT(DISTINCT ?b) AS ?c) WHERE {
        ?b ?p ?o .
        FILTER(isBlank(?b))
        FILTER NOT EXISTS { ?e ?sp ?b }
      }`,
    ),
  };
}

function sampleWrite(
  value: number,
  source: string,
  extra: Record<string, unknown> = {},
) {
  const generatedAt =
    (extra.generatedAt as string) ?? "2026-03-01T10:00:00.000Z";
  return {
    path: "price",
    value,
    statement: {
      rank: "preferred" as const,
      source,
      generatedAt,
      wasGeneratedBy: {
        formulaId: "test-formula",
        stratum: 1,
        inputFingerprint: `fp-${value}`,
        generatedAt,
      },
      ...extra,
    },
  };
}

function writeAt(
  path: string,
  value: number | string,
  extra: Record<string, unknown> = {},
) {
  const generatedAt =
    (extra.generatedAt as string) ?? "2026-03-01T10:00:00.000Z";
  return {
    path,
    value,
    statement: {
      rank: "preferred" as const,
      source: `src-${value}`,
      generatedAt,
      wasGeneratedBy: {
        formulaId: "test-formula",
        stratum: 1,
        inputFingerprint: `fp-${value}`,
        generatedAt,
      },
      ...extra,
    },
  };
}

const day = (n: number) => `2026-03-0${n}T10:00:00.000Z`;

const nestedOrderSchema: JSONSchema7 = {
  definitions: {
    Order: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        name: { type: "string" },
        total: { type: "number" },
        billing: {
          type: "object",
          properties: {
            total: { type: "number" },
            currency: { type: "string" },
            detail: {
              type: "object",
              properties: {
                net: { type: "number" },
                deep: {
                  type: "object",
                  properties: {
                    leaf: { type: "number" },
                    note: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const nestedPolicies = {
  "Order.total": "always",
  "Order.billing.total": "always",
  "Order.billing.detail.net": "always",
  "Order.billing.detail.deep.leaf": "always",
} as const;

describe("statement-node persistence", () => {
  test("repeated writeStatements and load/upsert keep triple and blank-node counts flat", async () => {
    const ox = new Store();
    const store = makeStore(ox);

    const itemId = entityIRI("Item", "persist-flat");
    await store.upsert("Item", itemId, makeItem("persist-flat") as never);
    const baseline = countStore(ox);

    for (let i = 1; i <= 3; i++) {
      await store.writeStatements("Item", itemId, [
        sampleWrite(i * 10, `w${i}`, { generatedAt: day(i) }),
      ]);
    }
    const afterWrites = countStore(ox);
    expect(afterWrites.triples).toBeGreaterThan(baseline.triples);

    for (let i = 1; i <= 3; i++) {
      const loaded = await store.loadOne("Item", itemId);
      await store.upsert("Item", itemId, loaded);
      expect(countStore(ox)).toEqual(afterWrites);
    }
  });

  test("nested inline object sidecars stay flat across re-saves", async () => {
    const ox = new Store();
    const id = `${BASE_IRI}Order/nested-flat`;
    const doc = {
      "@id": id,
      name: "order",
      total: 1,
      billing: {
        total: 1,
        currency: "EUR",
        detail: { net: 1, deep: { leaf: 1, note: "n" } },
      },
    };
    const { store } = initSPARQLDatastorePair({
      schema: nestedOrderSchema as never,
      defaultPrefix: BASE_IRI,
      jsonldContext: { "@vocab": BASE_IRI },
      typeNameToTypeIRI,
      queryBuildOptions: { ...queryBuildOptions, sparqlFlavour: "oxigraph" },
      sparqlQueryFunctions: makeSyncStoreCRUDFunctions(ox),
      defaultLimit: 100,
      statementMeta: { policies: nestedPolicies, encoding: "statement-node" },
    } as never);
    const api = store as unknown as StatementStore;

    await api.upsert("Order", id, doc);
    await api.writeStatements("Order", id, [
      writeAt("billing.total", 10, { generatedAt: day(1) }),
    ]);
    const afterWrite = countStore(ox);

    for (let i = 1; i <= 3; i++) {
      const loaded = await api.loadOne("Order", id);
      await api.upsert("Order", id, loaded);
      expect(countStore(ox)).toEqual(afterWrite);
    }
  });

  test("a named entity behind a …__stmt predicate keeps its triples", async () => {
    const ox = new Store();
    const store = makeStore(ox);
    const id = entityIRI("Item", "named-victim");
    const victim = entityIRI("Category", "named-victim-cat");

    await store.upsert("Category", victim, { "@id": victim, name: "victim" });
    await store.upsert("Item", id, makeItem("named-victim") as never);
    ox.update(`INSERT DATA { <${id}> <${BASE_IRI}price__stmt> <${victim}> }`);
    const victimBefore = sparqlCount(
      ox,
      `SELECT (COUNT(*) AS ?c) WHERE { <${victim}> ?p ?o }`,
    );

    const loaded = await store.loadOne("Item", id);
    await store.upsert("Item", id, loaded);

    const victimAfter = sparqlCount(
      ox,
      `SELECT (COUNT(*) AS ?c) WHERE { <${victim}> ?p ?o }`,
    );
    expect(victimAfter).toBe(victimBefore);
    expect(victimAfter).toBeGreaterThan(0);
  });

  test("a refused upsert leaves statement history untouched", async () => {
    const ox = new Store();
    const store = makeStore(ox);
    const id = entityIRI("Item", "refused-upsert");

    await store.upsert("Item", id, makeItem("refused-upsert") as never);
    await store.writeStatements("Item", id, [
      sampleWrite(10, "w1", { generatedAt: day(1) }),
    ]);
    await store.writeStatements("Item", id, [
      sampleWrite(20, "w2", { generatedAt: day(2) }),
    ]);
    const before = (await store.loadStatements("Item", id, ["price"])).price;
    expect(before?.length).toBe(2);

    await expect(
      store.upsert("Item", id, {
        ...makeItem("refused-upsert"),
        category: { "@id": "http://example.org/not a valid iri" },
      }),
    ).rejects.toThrow();

    const after = (await store.loadStatements("Item", id, ["price"])).price;
    expect(after?.length).toBe(2);
  });

  test("a third level inside a sidecar leaves no orphans across saves", async () => {
    const ox = new Store();
    const statementSchema: JSONSchema7 = {
      type: "object",
      properties: {
        value: { type: ["string", "number", "boolean"] },
        source: { type: "string" },
        generatedAt: { type: "string", format: "date-time" },
        evidence: {
          type: "object",
          properties: {
            quote: { type: "string" },
            locator: {
              type: "object",
              properties: {
                page: { type: "integer" },
                line: { type: "integer" },
              },
            },
          },
        },
      },
    };
    const store = makeStore(ox, {
      statementMeta: {
        policies: { "Item.price": "always" },
        encoding: "statement-node",
        statementSchema,
      },
    });
    const id = entityIRI("Item", "third-level");

    await store.upsert("Item", id, makeItem("third-level") as never);
    for (let n = 1; n <= 4; n++) {
      await store.writeStatements("Item", id, [
        {
          path: "price",
          value: 10,
          statement: {
            source: "s",
            generatedAt: day(1),
            evidence: { quote: "q", locator: { page: 3, line: n } },
          },
        },
      ]);
    }
    for (let n = 1; n <= 2; n++) {
      const loaded = await store.loadOne("Item", id);
      await store.upsert("Item", id, loaded);
    }
    expect(countStore(ox).orphans).toBe(0);
  });

  test("remove leaves zero triples and blank nodes for an entity with sidecars", async () => {
    const ox = new Store();
    const store = makeStore(ox);
    const id = entityIRI("Item", "remove-clean");

    await store.upsert("Item", id, makeItem("remove-clean") as never);
    await store.writeStatements("Item", id, [sampleWrite(10, "w1")]);
    expect(countStore(ox).triples).toBeGreaterThan(0);

    await store.remove("Item", id);
    const counts = countStore(ox);
    expect(counts.triples).toBe(0);
    expect(counts.blankNodes).toBe(0);
    expect(counts.orphans).toBe(0);
  });

  test("a too-deep statement path throws and sends no update", async () => {
    const ox = new Store();
    let updates = 0;
    const sparqlQueryFunctions = makeSyncStoreCRUDFunctions(ox);
    const id = `${BASE_IRI}Order/too-deep`;
    const doc = {
      "@id": id,
      name: "order",
      total: 1,
      billing: {
        total: 1,
        currency: "EUR",
        detail: { net: 1, deep: { leaf: 1, note: "n" } },
      },
    };
    const { store } = initSPARQLDatastorePair({
      schema: nestedOrderSchema as never,
      defaultPrefix: BASE_IRI,
      jsonldContext: { "@vocab": BASE_IRI },
      typeNameToTypeIRI,
      queryBuildOptions: { ...queryBuildOptions, sparqlFlavour: "oxigraph" },
      sparqlQueryFunctions: {
        ...sparqlQueryFunctions,
        updateFetch: async (query: string) => {
          updates++;
          return sparqlQueryFunctions.updateFetch!(query);
        },
      },
      defaultLimit: 100,
      statementMeta: { policies: nestedPolicies, encoding: "statement-node" },
    } as never);
    const api = store as unknown as StatementStore;

    await api.upsert("Order", id, doc);
    const updatesAfterUpsert = updates;

    await expect(
      api.writeStatements("Order", id, [
        writeAt("billing.detail.deep.leaf", 99, { generatedAt: day(1) }),
      ]),
    ).rejects.toThrow(/exceed the depth this store persists/);

    expect(updates).toBe(updatesAfterUpsert);
    const loaded = await api.loadStatements("Order", id, [
      "billing.detail.deep.leaf",
    ]);
    const rows = loaded["billing.detail.deep.leaf"];
    expect(rows?.length ?? 0).toBe(0);
  });

  test("raised walkerOptions.maxRecursion persists deep paths and remove cleans up", async () => {
    const ox = new Store();
    const id = `${BASE_IRI}Order/deep-ok`;
    const doc = {
      "@id": id,
      name: "order",
      total: 1,
      billing: {
        total: 1,
        currency: "EUR",
        detail: { net: 1, deep: { leaf: 1, note: "n" } },
      },
    };
    const { store } = initSPARQLDatastorePair({
      schema: nestedOrderSchema as never,
      defaultPrefix: BASE_IRI,
      jsonldContext: { "@vocab": BASE_IRI },
      typeNameToTypeIRI,
      queryBuildOptions: { ...queryBuildOptions, sparqlFlavour: "oxigraph" },
      sparqlQueryFunctions: makeSyncStoreCRUDFunctions(ox),
      defaultLimit: 100,
      statementMeta: { policies: nestedPolicies, encoding: "statement-node" },
      walkerOptions: { maxRecursion: 6, skipAtLevel: 6 },
    } as never);
    const api = store as unknown as StatementStore;

    await api.upsert("Order", id, doc);
    await api.writeStatements("Order", id, [
      writeAt("billing.detail.net", 42, { generatedAt: day(1) }),
    ]);
    await api.writeStatements("Order", id, [
      writeAt("billing.detail.deep.leaf", 7, { generatedAt: day(1) }),
    ]);
    const afterWrites = countStore(ox);

    const netLoaded = await api.loadStatements("Order", id, [
      "billing.detail.net",
    ]);
    const netRows = netLoaded["billing.detail.net"];
    expect(netRows?.[0]?.wasGeneratedBy).toBeDefined();

    const leafLoaded = await api.loadStatements("Order", id, [
      "billing.detail.deep.leaf",
    ]);
    const leafRows = leafLoaded["billing.detail.deep.leaf"];
    expect(leafRows?.length).toBe(1);
    expect(leafRows?.[0]?.value).toBe(7);

    for (let i = 1; i <= 2; i++) {
      const loaded = await api.loadOne("Order", id);
      await api.upsert("Order", id, loaded);
      expect(countStore(ox)).toEqual(afterWrites);
    }

    await api.remove("Order", id);
    const counts = countStore(ox);
    expect(counts.triples).toBe(0);
    expect(counts.blankNodes).toBe(0);
  });
});
