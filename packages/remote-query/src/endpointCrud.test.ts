import { afterEach, describe, expect, it } from "bun:test";

import { allegroCrudOptions } from "./remoteAllegro";
import { qleverCrudOptions } from "./remoteQlever";

const endpoint = {
  endpoint: "http://example.org/sparql",
  active: true,
  provider: "allegro" as const,
};

const auth = { username: "user", password: "pass" };

const stubFetch = (
  impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): typeof fetch =>
  Object.assign(impl, { preconnect: globalThis.fetch.preconnect });

describe("endpoint CRUD presets", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("allegro CONSTRUCT sends the n-triples accept header", async () => {
    let fetchCalls = 0;
    globalThis.fetch = stubFetch(async (_url, init) => {
      fetchCalls += 1;
      const headers = init?.headers as Record<string, string>;
      expect(headers.accept).toBe("application/n-triples,*/*;q=0.9");
      return new Response('<http://s> <http://p> "o" .', { status: 200 });
    });

    const crud = allegroCrudOptions(endpoint);
    const ds = await crud.constructFetch(
      "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
    );

    expect(fetchCalls).toBe(1);
    expect(ds.size).toBe(1);
  });

  it("allegro parses N-Triples CONSTRUCT responses into a dataset", async () => {
    globalThis.fetch = stubFetch(
      async () =>
        new Response(
          '<http://example.org/s> <http://example.org/p> "literal" .',
          { status: 200 },
        ),
    );

    const crud = allegroCrudOptions(endpoint);
    const ds = await crud.constructFetch(
      "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
    );

    expect(ds.size).toBe(1);
  });

  it("qlever CONSTRUCT sends the qlever-results accept header", async () => {
    let fetchCalls = 0;
    globalThis.fetch = stubFetch(async (_url, init) => {
      fetchCalls += 1;
      const headers = init?.headers as Record<string, string>;
      expect(headers.accept).toBe("application/qlever-results+json");
      return new Response(
        JSON.stringify({
          res: [["<http://s>", "<http://p>", '"o"']],
        }),
        { status: 200 },
      );
    });

    const crud = qleverCrudOptions({ ...endpoint, provider: "qlever" });
    const ds = await crud.constructFetch(
      "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
    );

    expect(fetchCalls).toBe(1);
    expect(ds.size).toBe(1);
  });

  it("qlever converts JSON row CONSTRUCT responses to a dataset", async () => {
    globalThis.fetch = stubFetch(
      async () =>
        new Response(
          JSON.stringify({
            res: [
              ["<http://a>", "<http://b>", '"one"'],
              ["<http://a>", "<http://c>", '"two"'],
            ],
          }),
          { status: 200 },
        ),
    );

    const crud = qleverCrudOptions({ ...endpoint, provider: "qlever" });
    const ds = await crud.constructFetch(
      "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
    );

    expect(ds.size).toBe(2);
  });

  it("sends basic auth when credentials are configured", async () => {
    let fetchCalls = 0;
    globalThis.fetch = stubFetch(async (_url, init) => {
      fetchCalls += 1;
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Basic dXNlcjpwYXNz");
      return new Response("", { status: 200 });
    });

    const crud = allegroCrudOptions({ ...endpoint, auth });
    await crud.constructFetch("CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }");

    expect(fetchCalls).toBe(1);
  });
});
