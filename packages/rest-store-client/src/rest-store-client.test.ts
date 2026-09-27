import type { CalcValuesEntry, Identifies } from "@graviola/store-core";
import { describe, expect, test } from "bun:test";

import { capabilityDescriptorFromHandshake } from "./descriptor-from-handshake";
import type { GraviolaStoreHandshakeResponse } from "./handshake-types";
import { createRestTransport } from "./shared/fetcher";
import { createLegacyRESTClientStore } from "./v0/LegacyRESTClientStore";
import { createRESTClientStoreClient } from "./v1/RESTClientStore";

const identifies: Identifies = {
  typeNameToTypeIRI: (name: string) => `http://example.org/types/${name}`,
  typeIRItoTypeName: (iri: string) =>
    iri.replace("http://example.org/types/", ""),
};

const requestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

describe("capabilityDescriptorFromHandshake", () => {
  test("aggregates OR across types", () => {
    const hs: GraviolaStoreHandshakeResponse = {
      graviolaStore: {
        version: "1",
        basePath: "/api",
        iriHandling: ["fullIRI"],
        auth: { modes: ["none"] },
        pagination: { modes: ["offset"] },
        types: {
          A: { capabilities: { loads: true, writes: false } },
          B: { capabilities: { loads: true, writes: true } },
        },
      },
    };
    const d = capabilityDescriptorFromHandshake(hs.graviolaStore);
    expect(d.loads).toBe(true);
    expect(d.writes).toBe(true);
    expect(d.identifies).toBe(true);
  });

  test("fills profiles.calc.rootTypes and keeps profiles.searches", () => {
    const hs: GraviolaStoreHandshakeResponse = {
      graviolaStore: {
        version: "1",
        basePath: "/api",
        iriHandling: ["fullIRI"],
        auth: { modes: ["none"] },
        pagination: { modes: ["offset"] },
        calc: {
          supported: true,
          rootTypes: ["Plot", "Garden"],
          profileFingerprints: { Plot: "sha256:abc" },
        },
        types: {
          Plot: {
            capabilities: {
              loads: true,
              searches: { mode: "substring", ranked: true },
            },
          },
        },
      },
    };
    const d = capabilityDescriptorFromHandshake(hs.graviolaStore);
    expect(d.calc).toBe(true);
    expect(d.profiles?.searches).toEqual({
      mode: "substring",
      ranked: true,
    });
    expect(d.profiles?.calc?.rootTypes).toEqual(["Plot", "Garden"]);
    expect(d.profiles?.calc?.profileFingerprints).toEqual({
      Plot: "sha256:abc",
    });
  });
});

describe("LegacyRESTClientStore", () => {
  test("builds loadDocument URL like legacy client", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: requestUrl(input), init });
      return new Response(JSON.stringify({ "@id": "http://ex/P", name: "x" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const store = createLegacyRESTClientStore({
      apiURL: "https://api.example.com",
      identifies,
      fetchImpl: fetchImpl as typeof fetch,
    });
    await store.loadOne("Plot", "http://ex/P");
    expect(calls[0].url).toContain("/loadDocument/Plot");
    expect(calls[0].url).toContain("id=");
  });
});

describe("RESTClientStore", () => {
  test("GET entity uses handshake basePath + encoded IRI", async () => {
    const hs: GraviolaStoreHandshakeResponse = {
      graviolaStore: {
        version: "1",
        basePath: "/graviola",
        iriHandling: ["fullIRI"],
        auth: { modes: ["none"] },
        pagination: { modes: ["offset"] },
        resolves: { supported: false },
        types: {
          Plot: {
            capabilities: {
              loads: true,
              lists: true,
              filters: false,
              writes: true,
              removes: true,
              counts: true,
              searches: { mode: "substring", ranked: false },
            },
          },
        },
      },
    };
    const calls: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      calls.push(url);
      if (url.includes("/.well-known/graviola-store")) {
        return new Response(JSON.stringify(hs), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ "@id": "http://ex/P" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const transport = createRestTransport({
      baseUrl: "https://api.example.com",
      auth: { mode: "none" },
      fetchImpl: fetchImpl as typeof fetch,
    });
    transport.advertisedAuthModes = hs.graviolaStore.auth.modes;
    const store = createRESTClientStoreClient({
      transport,
      handshake: hs,
      identifies,
      iriHandling: "fullIRI",
    });
    await store.loadOne("Plot", "http://ex/P");
    expect(calls.some((u) => u.includes("/graviola/Plot/"))).toBe(true);
  });

  test("calcWarm posts to type-scoped warm route", async () => {
    const hs: GraviolaStoreHandshakeResponse = {
      graviolaStore: {
        version: "1",
        basePath: "/graviola",
        iriHandling: ["fullIRI"],
        auth: { modes: ["none"] },
        pagination: { modes: ["offset"] },
        calc: { supported: true, rootTypes: ["A"] },
        types: { A: { capabilities: { loads: true } } },
      },
    };
    const posts: { url: string; body: unknown }[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const req =
        input instanceof Request ? input : new Request(input, init ?? {});
      if (req.method === "POST") {
        posts.push({
          url: req.url,
          body: JSON.parse(await req.clone().text()),
        });
      }
      return new Response(
        JSON.stringify({
          warmed: 1,
          skippedFresh: 0,
          writesIssued: 1,
          queriesIssued: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };
    const transport = createRestTransport({
      baseUrl: "https://api.example.com",
      auth: { mode: "none" },
      fetchImpl: fetchImpl as typeof fetch,
    });
    transport.advertisedAuthModes = hs.graviolaStore.auth.modes;
    const store = createRESTClientStoreClient({
      transport,
      handshake: hs,
      identifies,
      iriHandling: "fullIRI",
    });
    const result = await store.calcWarm!("A", { rootIRIs: ["x"] });
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toContain("/graviola/A/_calc/warm");
    expect(posts[0].body).toEqual({ rootIRIs: ["x"] });
    expect(result.warmed).toBe(1);
  });

  test("readCalcValues posts to type-scoped values route", async () => {
    const hs: GraviolaStoreHandshakeResponse = {
      graviolaStore: {
        version: "1",
        basePath: "/graviola",
        iriHandling: ["fullIRI"],
        auth: { modes: ["none"] },
        pagination: { modes: ["offset"] },
        calc: { supported: true, rootTypes: ["A"] },
        types: { A: { capabilities: { loads: true } } },
      },
    };
    const entries: CalcValuesEntry[] = [
      {
        entityIRI: "x",
        data: { fee: 10 },
        provenance: {
          sources: ["store"],
          fetchedAt: "2026-01-01T00:00:00.000Z",
          freshness: "fresh",
        },
      },
      {
        entityIRI: "y",
        data: null,
        provenance: {
          sources: ["store"],
          fetchedAt: "2026-01-01T00:00:00.000Z",
          freshness: "unknown",
        },
      },
    ];
    const posts: { url: string; body: unknown }[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const req =
        input instanceof Request ? input : new Request(input, init ?? {});
      if (req.method === "POST") {
        posts.push({
          url: req.url,
          body: JSON.parse(await req.clone().text()),
        });
      }
      return new Response(JSON.stringify(entries), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const transport = createRestTransport({
      baseUrl: "https://api.example.com",
      auth: { mode: "none" },
      fetchImpl: fetchImpl as typeof fetch,
    });
    transport.advertisedAuthModes = hs.graviolaStore.auth.modes;
    const store = createRESTClientStoreClient({
      transport,
      handshake: hs,
      identifies,
      iriHandling: "fullIRI",
    });
    const result = await store.readCalcValues!("A", ["x", "y"]);
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toContain("/graviola/A/_calc/values");
    expect(posts[0].body).toEqual({ entityIRIs: ["x", "y"] });
    expect(result).toEqual(entries);
  });
});

describe("createRestTransport / ky", () => {
  test("mutatingJson retries 503 and sends the same Idempotency-Key each attempt", async () => {
    const idempotencyHeaders: (string | null)[] = [];
    let attempt = 0;
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const req =
        input instanceof Request ? input : new Request(input, init ?? {});
      idempotencyHeaders.push(req.headers.get("Idempotency-Key"));
      attempt += 1;
      if (attempt === 1) {
        return new Response("unavailable", { status: 503 });
      }
      return new Response(JSON.stringify({ "@id": "http://ex/X", ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const transport = createRestTransport({
      baseUrl: "https://api.example.com",
      auth: { mode: "none" },
      fetchImpl: fetchImpl as typeof fetch,
      retry: {
        limit: 3,
        methods: ["put", "post", "patch", "delete"],
        statusCodes: [503],
        backoffLimit: 8_000,
      },
    });
    const res = await transport.mutatingJson(
      "PUT",
      "v1/items/http%3A%2F%2Fex%2FX",
      { "@id": "http://ex/X" },
    );
    expect(res.status).toBe(200);
    expect(attempt).toBe(2);
    expect(idempotencyHeaders[0]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(idempotencyHeaders[1]).toBe(idempotencyHeaders[0]);
  });
});
