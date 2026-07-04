import type { Identifies } from "@graviola/store-core";
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
} from "./inMemoryStore.js";
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
    const stub = { "@id": "http://example.org/Person/stub", name: "Stubbed" };
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
