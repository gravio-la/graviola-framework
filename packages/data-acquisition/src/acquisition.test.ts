import { describe, expect, test } from "bun:test";

import { resolveBinding, renderTemplate } from "./bind";
import { createMemoryCache } from "./cache";
import { createAcquisitionRuntime } from "./runtime";
import { createRateLimiter } from "./net/limiter";
import type { BindingScope, RestSource, SparqlSelectSource } from "./types";

describe("bind", () => {
  const scope: BindingScope = {
    input: { qid: "Q1731", nested: { a: 1 } },
    row: { name: "Dresden", tags: ["a", "b"] },
    document: { entities: [{ id: "x" }, { id: "y" }] },
  };

  test("const", () => {
    expect(resolveBinding({ kind: "const", value: 42 }, scope)).toBe(42);
  });

  test("lodash path", () => {
    expect(
      resolveBinding({ kind: "path", from: "input", path: "nested.a" }, scope),
    ).toBe(1);
  });

  test("string[] path", () => {
    expect(
      resolveBinding(
        { kind: "path", from: "input", path: ["nested", "a"] },
        scope,
      ),
    ).toBe(1);
  });

  test("jsonpath take first", () => {
    expect(
      resolveBinding(
        {
          kind: "path",
          from: "document",
          path: "$.entities[*].id",
          take: "first",
        },
        scope,
      ),
    ).toBe("x");
  });

  test("required throws", () => {
    expect(() =>
      resolveBinding(
        { kind: "path", from: "input", path: "missing", required: true },
        scope,
      ),
    ).toThrow(/Required binding/);
  });

  test("default", () => {
    expect(
      resolveBinding(
        {
          kind: "path",
          from: "input",
          path: "missing",
          default: "fallback",
        },
        scope,
      ),
    ).toBe("fallback");
  });

  test("template", () => {
    expect(
      resolveBinding(
        {
          kind: "template",
          template: "wd:{{qid}}",
          params: {
            qid: { kind: "path", from: "input", path: "qid" },
          },
        },
        scope,
      ),
    ).toBe("wd:Q1731");
  });

  test("renderTemplate", () => {
    expect(renderTemplate("a={{x}}", { x: 1 })).toBe("a=1");
  });
});

describe("cache", () => {
  test("hit/miss/hash-mismatch/offline", async () => {
    const cache = createMemoryCache();
    expect(await cache.get("k", "h1")).toBeNull();
    expect(cache.stats().misses).toBe(1);

    await cache.set("k", "h1", { v: 1 });
    const hit = await cache.get<{ v: number }>("k", "h1");
    expect(hit?.value.v).toBe(1);
    expect(hit?.cache).toBe("hit");

    expect(await cache.get("k", "h2")).toBeNull();

    const offline = createMemoryCache({ offline: true });
    await expect(offline.get("missing", "h")).rejects.toThrow(/offline/);
  });

  test("TTL expiry", async () => {
    const cache = createMemoryCache();
    await cache.set("k", "h", 1, 0); // maxAge 0 → immediate expiry on next get after tick
    // storedAt is now; maxAgeSeconds 0 means age > 0 fails — wait 1ms
    await Bun.sleep(2);
    expect(await cache.get("k", "h")).toBeNull();
  });

  test("refresh always misses", async () => {
    const cache = createMemoryCache({ refresh: true });
    await cache.set("k", "h", 1);
    expect(await cache.get("k", "h")).toBeNull();
  });
});

describe("limiter", () => {
  test("minIntervalMs paces requests", async () => {
    const limiter = createRateLimiter({
      test: { minIntervalMs: 50 },
    });
    const t0 = Date.now();
    await limiter.acquire("test");
    await limiter.acquire("test");
    await limiter.acquire("test");
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeGreaterThanOrEqual(90); // (3-1)*50
  });
});

describe("runtime rest + sparql", () => {
  test("rest with injected fetchImpl, cache, provenance", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return new Response(JSON.stringify({ data: [{ id: 1 }, { id: 2 }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const provenances: unknown[] = [];
    const runtime = createAcquisitionRuntime({
      fetchImpl,
      onProvenance: (p) => provenances.push(p),
    });

    const source: RestSource = {
      id: "test/rest",
      kind: "rest",
      url: "https://example.test/api",
      itemsPath: "$.data[*]",
      cache: { maxAgeSeconds: 3600 },
    };

    const r1 = await runtime.fetch(source);
    expect(r1.ok).toBe(true);
    if (r1.ok) {
      expect(r1.items).toHaveLength(2);
      expect(r1.provenance.cache).toBe("miss");
    }

    const r2 = await runtime.fetch(source);
    expect(r2.ok).toBe(true);
    if (r2.ok) {
      expect(r2.provenance.cache).toBe("hit");
    }
    expect(calls).toBe(1);
    expect(provenances).toHaveLength(2);
  });

  test("retry 429 then success; 400 not retried", async () => {
    let n = 0;
    const fetchImpl: typeof fetch = async () => {
      n += 1;
      if (n === 1) {
        return new Response("slow down", {
          status: 429,
          headers: { "Retry-After": "0" },
        });
      }
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    };
    const runtime = createAcquisitionRuntime({ fetchImpl });
    const source: RestSource = {
      id: "test/retry",
      kind: "rest",
      url: "https://example.test/r",
      cache: { disabled: true },
    };
    const r = await runtime.fetch(source);
    expect(r.ok).toBe(true);
    expect(n).toBe(2);

    const fetch400: typeof fetch = async () =>
      new Response("bad", { status: 400 });
    const runtime2 = createAcquisitionRuntime({ fetchImpl: fetch400 });
    const r2 = await runtime2.fetch(source);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.retryable).toBe(false);
  });

  test("sparql-select projects bindings", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          results: {
            bindings: [
              {
                qid: {
                  type: "uri",
                  value: "http://www.wikidata.org/entity/Q1",
                },
              },
            ],
          },
        }),
        { status: 200 },
      );
    const runtime = createAcquisitionRuntime({ fetchImpl });
    const source: SparqlSelectSource = {
      id: "wd/test",
      kind: "sparql-select",
      endpoint: "https://query.wikidata.org/sparql",
      query: "SELECT ?qid WHERE { ?qid wdt:P31 wd:{{class}} }",
      params: {
        class: { kind: "const", value: "Q5" },
      },
      cache: { disabled: true },
    };
    const r = await runtime.fetch(source);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.items).toHaveLength(1);
  });

  test("next-link pagination walks 3 pages", async () => {
    const pages: Record<string, object> = {
      "https://example.test/p1": {
        data: [{ id: 1 }],
        links: { next: "https://example.test/p2" },
      },
      "https://example.test/p2": {
        data: [{ id: 2 }],
        links: { next: "https://example.test/p3" },
      },
      "https://example.test/p3": {
        data: [{ id: 3 }],
        links: { next: null },
      },
    };
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      return new Response(JSON.stringify(pages[url]), { status: 200 });
    };
    const runtime = createAcquisitionRuntime({ fetchImpl });
    const source: RestSource = {
      id: "test/pages",
      kind: "rest",
      url: "https://example.test/p1",
      itemsPath: "$.data[*]",
      pagination: { kind: "next-link", path: "links.next", maxPages: 10 },
      cache: { disabled: true },
    };
    const r = await runtime.fetch(source);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.items).toHaveLength(3);
      expect(r.provenance.pages).toBe(3);
    }
  });

  test("maxPages respected", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return new Response(
        JSON.stringify({
          data: [{ id: calls }],
          links: { next: `https://example.test/p${calls + 1}` },
        }),
        { status: 200 },
      );
    };
    const runtime = createAcquisitionRuntime({ fetchImpl });
    const source: RestSource = {
      id: "test/max",
      kind: "rest",
      url: "https://example.test/p1",
      itemsPath: "$.data[*]",
      pagination: { kind: "next-link", path: "links.next", maxPages: 2 },
      cache: { disabled: true },
    };
    const r = await runtime.fetch(source);
    expect(r.ok).toBe(true);
    expect(calls).toBe(2);
  });

  test("adapter + toAuthorityConfiguration", async () => {
    const runtime = createAcquisitionRuntime();
    const source = {
      id: "test/entity",
      kind: "entity-by-iri" as const,
      authorityIRI: "http://www.wikidata.org",
      url: "https://www.wikidata.org/wiki/Special:EntityData/{{qid}}.json",
      idFrom: [{ pattern: "Q(\\d+)", as: "qid" }],
      cache: { disabled: true } as const,
    };
    // Use adapter instead to avoid network
    const adapter = {
      id: "test/adapter",
      kind: "adapter" as const,
      authorityIRI: "http://www.wikidata.org",
      fetch: async () => ({ items: [{ id: "Q1", labels: {} }] }),
    };
    const r = await runtime.fetch(adapter, { input: { iri: "Q1" } });
    expect(r.ok).toBe(true);

    // entity-by-iri via mocked fetch
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ entities: { Q1731: { id: "Q1731" } } }), {
        status: 200,
      });
    const rt2 = createAcquisitionRuntime({ fetchImpl });
    const entitySource = {
      ...source,
      documentPath: "entities.Q1731",
    };
    const auth = rt2.toAuthorityConfiguration(entitySource);
    const doc = await auth.getEntityByIRI(
      "http://www.wikidata.org/entity/Q1731",
    );
    expect(doc.id).toBe("Q1731");
  });

  test("provenance on failure", async () => {
    const provenances: { cache: string }[] = [];
    const runtime = createAcquisitionRuntime({
      fetchImpl: async () => new Response("nope", { status: 500 }),
      onProvenance: (p) => provenances.push(p),
    });
    const r = await runtime.fetch({
      id: "fail",
      kind: "rest",
      url: "https://example.test/x",
      cache: { disabled: true },
    });
    expect(r.ok).toBe(false);
    expect(provenances.length).toBe(1);
    expect(r.provenance.sourceId).toBe("fail");
  });
});
