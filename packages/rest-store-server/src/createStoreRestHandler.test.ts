import type { Calc, CalcValuesEntry, Identifies } from "@graviola/store-core";
import {
  createRESTClientStoreClient,
  createRestTransport,
  fetchGraviolaStoreHandshake,
  GraviolaRestError,
  type RestTransport,
} from "@graviola/rest-store-client";
import { describe, expect, test } from "bun:test";

import { createStoreRestHandler } from "./createStoreRestHandler.js";
import {
  provenanceStampInterceptor,
  shortCircuitUpsertInterceptor,
} from "./interceptors/provenanceStamp.js";
import { loggingMiddleware } from "./middleware/logging.js";
import {
  createInMemoryStore,
  createReadOnlyInMemoryStore,
} from "./testing/inMemoryStore.js";
import type { StoreRestHandler } from "./createStoreRestHandler.js";

type DemoSchema = {
  Person: {
    "@id": string;
    "@type": string;
    name: string;
    label?: string;
    _provenance?: unknown;
  };
};

type CalcSchema = {
  A: { "@id": string; name: string };
  B: { "@id": string; name: string };
};

const identifies: Identifies = {
  typeNameToTypeIRI: (name: string) => `http://example.org/types/${name}`,
  typeIRItoTypeName: (iri: string) =>
    iri.replace("http://example.org/types/", ""),
};

const BASE_URL = "http://in-process.test";
const TYPE_NAMES = ["Person"] as const;

const createHandlerTransport = (
  handler: StoreRestHandler,
  baseUrl = BASE_URL,
): RestTransport => {
  const fetchImpl = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const req =
      input instanceof Request ? input : new Request(input, init ?? {});
    const res = await handler(req);
    return res ?? new Response("Not Found", { status: 404 });
  };

  return createRestTransport({
    baseUrl,
    auth: { mode: "none" },
    fetchImpl: fetchImpl as typeof fetch,
    retry: 0,
  });
};

const setupClient = async (handler: StoreRestHandler) => {
  const transport = createHandlerTransport(handler);
  const handshake = await fetchGraviolaStoreHandshake(
    transport,
    "/.well-known/graviola-store",
  );
  const client = createRESTClientStoreClient<DemoSchema>({
    transport,
    handshake,
    identifies,
    iriHandling: "fullIRI",
  });
  return { transport, handshake, client };
};

const createCalcStore = (rootTypes = ["A"]) => {
  const mem = createInMemoryStore<CalcSchema>({
    identifies,
    typeNames: ["A", "B"],
  });
  mem.capabilities.calc = true;
  mem.capabilities.profiles = {
    ...mem.capabilities.profiles,
    calc: {
      rootTypes,
      profileFingerprints: Object.fromEntries(
        rootTypes.map((typeName) => [typeName, `fingerprint-${typeName}`]),
      ),
    },
  };

  const warmCalls: Array<{
    typeName: string;
    options?: { rootIRIs?: string[]; skipFresh?: boolean };
  }> = [];
  const valueCalls: Array<{ typeName: string; entityIRIs: string[] }> = [];
  const calc: Calc<CalcSchema> = {
    calcWarm: async (
      typeName,
      options?: { rootIRIs?: string[]; skipFresh?: boolean },
    ) => {
      warmCalls.push({ typeName, options });
      return {
        warmed: options?.rootIRIs?.length ?? 0,
        skippedFresh: 0,
        writesIssued: 1,
        queriesIssued: 1,
      };
    },
    readCalcValues: async (
      typeName,
      entityIRIs: string[],
    ): Promise<CalcValuesEntry[]> => {
      valueCalls.push({ typeName, entityIRIs });
      return entityIRIs.map((entityIRI) => ({
        entityIRI,
        data: { computed: `${typeName}:${entityIRI}` },
        provenance: {
          sources: [],
          fetchedAt: "2026-09-27T12:00:00.000Z",
          freshness: "fresh",
        },
      }));
    },
  };
  const store = Object.assign(mem, calc);

  return { store, warmCalls, valueCalls };
};

describe("createStoreRestHandler contract", () => {
  test("round-trips CRUD and query operations via RESTClientStore", async () => {
    const mem = createInMemoryStore<DemoSchema>({
      identifies,
      typeNames: [...TYPE_NAMES],
    });
    const handler = createStoreRestHandler({
      store: mem,
      typeNames: [...TYPE_NAMES],
      basePath: "/api/graviola",
    });
    const { client } = await setupClient(handler);

    const aliceIri = "http://example.org/Person/alice";
    const bobIri = "http://example.org/Person/bob";

    await client.upsert("Person", aliceIri, {
      "@id": aliceIri,
      "@type": identifies.typeNameToTypeIRI("Person"),
      name: "Alice",
      label: "Alice Alpha",
    });
    await client.upsert("Person", bobIri, {
      "@id": bobIri,
      "@type": identifies.typeNameToTypeIRI("Person"),
      name: "Bob",
      label: "Bob Beta",
    });

    const loaded = await client.loadOne("Person", aliceIri);
    expect(loaded?.name).toBe("Alice");

    const withMeta = await client.loadOne("Person", aliceIri, {
      withMeta: true,
    });
    expect(withMeta?.data.name).toBe("Alice");
    expect(withMeta?.provenance.sources.length).toBeGreaterThan(0);

    expect(await client.exists("Person", aliceIri)).toBe(true);
    expect(
      await client.exists("Person", "http://example.org/Person/missing"),
    ).toBe(false);

    const listed = await client.list("Person", 10, {
      search: "Alice",
      sorting: [{ id: "name", desc: false }],
    });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.name).toBe("Alice");

    const filtered = await client.filterMany("Person", {
      where: { "@id": aliceIri },
    });
    expect(filtered).toHaveLength(1);

    expect(await client.count("Person", { search: "Bob" })).toBe(1);

    const searched = await client.searchByLabel("Person", "Beta", 5);
    expect(searched).toHaveLength(1);
    expect(searched[0]?.name).toBe("Bob");

    const entityRows = await client.findEntityByTypeName("Person", "Alice", 5);
    expect(entityRows[0]?.entityIRI).toBe(aliceIri);
    expect(entityRows[0]?.label).toBe("Alice Alpha");

    const types = await client.resolveTypes(aliceIri);
    expect(types).toContain(identifies.typeNameToTypeIRI("Person"));

    await client.remove("Person", aliceIri);
    expect(await client.loadOne("Person", aliceIri)).toBeNull();
  });

  test("missing writes capability → 501 capability_not_supported", async () => {
    const mem = createReadOnlyInMemoryStore<DemoSchema>({
      identifies,
      typeNames: [...TYPE_NAMES],
    });
    const handler = createStoreRestHandler({
      store: mem,
      typeNames: [...TYPE_NAMES],
    });
    const { client } = await setupClient(handler);

    await expect(
      client.upsert("Person", "http://example.org/Person/x", {
        "@id": "http://example.org/Person/x",
        "@type": identifies.typeNameToTypeIRI("Person"),
        name: "X",
      }),
    ).rejects.toMatchObject({
      status: 501,
      code: "capability_not_supported",
    } satisfies Partial<GraviolaRestError>);
  });

  test("malicious entityIRIs in _query body → 400 invalid_entity_iri", async () => {
    const mem = createInMemoryStore<DemoSchema>({
      identifies,
      typeNames: [...TYPE_NAMES],
    });
    const handler = createStoreRestHandler({
      store: mem,
      typeNames: [...TYPE_NAMES],
      basePath: "/api/graviola",
    });

    const response = await handler(
      new Request(`${BASE_URL}/api/graviola/Person/_query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityIRIs: [
            "http://example.org/x> } UNION { ?entity ?p ?o . FILTER(isIRI(?entity)) } #",
          ],
        }),
      }),
    );
    expect(response?.status).toBe(400);
    expect(await response?.json()).toMatchObject({
      code: "invalid_entity_iri",
    });
  });

  test("crafted path segment → 400 invalid_entity_iri", async () => {
    const mem = createInMemoryStore<DemoSchema>({
      identifies,
      typeNames: [...TYPE_NAMES],
    });
    const handler = createStoreRestHandler({
      store: mem,
      typeNames: [...TYPE_NAMES],
      basePath: "/api/graviola",
    });

    const maliciousIri = encodeURIComponent(
      "http://example.org/x> } UNION { ?entity ?p ?o .",
    );
    const response = await handler(
      new Request(`${BASE_URL}/api/graviola/Person/${maliciousIri}`),
    );
    expect(response?.status).toBe(400);
    expect(await response?.json()).toMatchObject({
      code: "invalid_entity_iri",
    });
  });

  test("unknown type → 404 unknown_type", async () => {
    const mem = createInMemoryStore<DemoSchema>({
      identifies,
      typeNames: [...TYPE_NAMES],
    });
    const handler = createStoreRestHandler({
      store: mem,
      typeNames: [...TYPE_NAMES],
    });
    const transport = createHandlerTransport(handler);
    const res = await transport.getUnchecked(
      "api/graviola/Unknown/http%3A%2F%2Fex%2Fx",
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("unknown_type");
  });

  test("provenanceStamp interceptor stamps upsert documents", async () => {
    const mem = createInMemoryStore<DemoSchema>({
      identifies,
      typeNames: [...TYPE_NAMES],
    });
    const handler = createStoreRestHandler({
      store: mem,
      typeNames: [...TYPE_NAMES],
      interceptors: [provenanceStampInterceptor()],
    });
    const { client } = await setupClient(handler);

    const iri = "http://example.org/Person/stamped";
    await client.upsert("Person", iri, {
      "@id": iri,
      "@type": identifies.typeNameToTypeIRI("Person"),
      name: "Stamped",
    });
    const doc = await client.loadOne("Person", iri);
    expect(doc?._provenance).toMatchObject({ source: "rest-store-server" });
  });

  test("interceptor short-circuit skips the store", async () => {
    const mem = createInMemoryStore<DemoSchema>({
      identifies,
      typeNames: [...TYPE_NAMES],
    });
    const stub = {
      "@id": "http://example.org/Person/stub",
      "@type": identifies.typeNameToTypeIRI("Person"),
      name: "Stubbed",
    };
    const handler = createStoreRestHandler({
      store: mem,
      typeNames: [...TYPE_NAMES],
      interceptors: [shortCircuitUpsertInterceptor(stub)],
    });
    const { client } = await setupClient(handler);

    const iri = "http://example.org/Person/stub";
    const echoed = await client.upsert("Person", iri, {
      "@id": iri,
      "@type": identifies.typeNameToTypeIRI("Person"),
      name: "Ignored",
    });
    expect(echoed).toEqual(stub);
    expect(await client.loadOne("Person", iri)).toBeNull();
  });

  test("middleware runs in order before handler", async () => {
    const order: string[] = [];
    const mem = createInMemoryStore<DemoSchema>({
      identifies,
      typeNames: [...TYPE_NAMES],
    });
    const handler = createStoreRestHandler({
      store: mem,
      typeNames: [...TYPE_NAMES],
      middleware: [
        async (_req, _ctx, next) => {
          order.push("mw1-before");
          const res = await next(_req);
          order.push("mw1-after");
          return res;
        },
        loggingMiddleware({ log: () => order.push("logged") }),
      ],
    });
    const transport = createHandlerTransport(handler);
    await transport.get("api/graviola/Person");
    expect(order[0]).toBe("mw1-before");
    expect(order).toContain("logged");
    expect(order.at(-1)).toBe("mw1-after");
  });

  test("enforces pagination.maxLimit", async () => {
    const mem = createInMemoryStore<DemoSchema>({
      identifies,
      typeNames: [...TYPE_NAMES],
    });
    for (let i = 0; i < 5; i++) {
      const iri = `http://example.org/Person/p${i}`;
      mem.documents.set(`${"Person"}::${iri}`, {
        "@id": iri,
        "@type": identifies.typeNameToTypeIRI("Person"),
        name: `P${i}`,
      });
    }
    const handler = createStoreRestHandler({
      store: mem,
      typeNames: [...TYPE_NAMES],
      pagination: { maxLimit: 2 },
    });
    const { client } = await setupClient(handler);
    const rows = await client.list("Person", 100);
    expect(rows.length).toBeLessThanOrEqual(2);
  });
});

describe("createStoreRestHandler calc routes", () => {
  test("warms a calc root type and rejects a non-root type", async () => {
    const { store, warmCalls } = createCalcStore();
    const handler = createStoreRestHandler({
      store,
      typeNames: ["A", "B"],
    });

    const warmResponse = await handler(
      new Request(`${BASE_URL}/api/graviola/A/_calc/warm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rootIRIs: ["urn:a:1"],
          skipFresh: true,
        }),
      }),
    );
    expect(warmResponse?.status).toBe(200);
    expect(warmCalls).toEqual([
      {
        typeName: "A",
        options: { rootIRIs: ["urn:a:1"], skipFresh: true },
      },
    ]);

    const nonRootResponse = await handler(
      new Request(`${BASE_URL}/api/graviola/B/_calc/warm`, {
        method: "POST",
        body: "{}",
      }),
    );
    expect(nonRootResponse?.status).toBe(400);
    expect(await nonRootResponse?.json()).toMatchObject({
      code: "calc_type_not_supported",
    });
  });

  test("returns calc value entries in request order", async () => {
    const { store, valueCalls } = createCalcStore();
    const handler = createStoreRestHandler({
      store,
      typeNames: ["A", "B"],
    });
    const entityIRIs = ["urn:a:2", "urn:a:1"];

    const response = await handler(
      new Request(`${BASE_URL}/api/graviola/A/_calc/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityIRIs }),
      }),
    );
    expect(response?.status).toBe(200);
    const entries = (await response?.json()) as CalcValuesEntry[];
    expect(entries.map((entry) => entry.entityIRI)).toEqual(entityIRIs);
    expect(valueCalls).toEqual([{ typeName: "A", entityIRIs }]);
  });

  test("materialized load applies only to calc root types", async () => {
    const { store, valueCalls } = createCalcStore();
    store.documents.set("B::urn:b:1", {
      "@id": "urn:b:1",
      name: "Plain B",
    });
    const handler = createStoreRestHandler({
      store,
      typeNames: ["A", "B"],
    });
    const headers = { Accept: "application/vnd.graviola-store.envelope+json" };

    const materializedResponse = await handler(
      new Request(
        `${BASE_URL}/api/graviola/A/${encodeURIComponent("urn:a:1")}?materialized=1`,
        { headers },
      ),
    );
    expect(materializedResponse?.status).toBe(200);
    expect(await materializedResponse?.json()).toEqual({
      data: { computed: "A:urn:a:1" },
      provenance: {
        sources: [store.storeId],
        fetchedAt: "2026-09-27T12:00:00.000Z",
        freshness: "fresh",
      },
    });

    const plainResponse = await handler(
      new Request(
        `${BASE_URL}/api/graviola/B/${encodeURIComponent("urn:b:1")}?materialized=1`,
        { headers },
      ),
    );
    expect(plainResponse?.status).toBe(200);
    expect(await plainResponse?.json()).toMatchObject({
      data: { "@id": "urn:b:1", name: "Plain B" },
    });
    expect(valueCalls).toEqual([{ typeName: "A", entityIRIs: ["urn:a:1"] }]);
  });

  test("supports the deprecated warm route only for one root type", async () => {
    const oneRoot = createCalcStore();
    const oneRootHandler = createStoreRestHandler({
      store: oneRoot.store,
      typeNames: ["A", "B"],
    });
    const success = await oneRootHandler(
      new Request(`${BASE_URL}/api/graviola/_calc/warm`, {
        method: "POST",
        body: "{}",
      }),
    );
    expect(success?.status).toBe(200);
    expect(oneRoot.warmCalls[0]?.typeName).toBe("A");

    const twoRoots = createCalcStore(["A", "B"]);
    const twoRootHandler = createStoreRestHandler({
      store: twoRoots.store,
      typeNames: ["A", "B"],
    });
    const rejected = await twoRootHandler(
      new Request(`${BASE_URL}/api/graviola/_calc/warm`, {
        method: "POST",
        body: "{}",
      }),
    );
    expect(rejected?.status).toBe(400);
    expect(await rejected?.text()).toContain("POST /:type/_calc/warm");
    expect(twoRoots.warmCalls).toHaveLength(0);
  });

  test("advertises calc root types and profile fingerprints", async () => {
    const { store } = createCalcStore();
    const handler = createStoreRestHandler({
      store,
      typeNames: ["A", "B"],
    });

    const response = await handler(
      new Request(`${BASE_URL}/.well-known/graviola-store`),
    );
    expect(await response?.json()).toMatchObject({
      graviolaStore: {
        calc: {
          supported: true,
          rootTypes: ["A"],
          profileFingerprints: { A: "fingerprint-A" },
        },
      },
    });
  });
});
