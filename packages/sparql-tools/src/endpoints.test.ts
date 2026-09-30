import { describe, expect, test } from "bun:test";
import { InvalidIriError } from "@graviola/edb-core-utils";
import { clearGraph } from "./index";
import {
  graphStoreUrl,
  normalizeSparqlBase,
  sparqlEndpointUrls,
} from "./endpoints";

describe("normalizeSparqlBase", () => {
  test("strips trailing slashes", () => {
    expect(normalizeSparqlBase("http://localhost:7878/")).toBe(
      "http://localhost:7878",
    );
    expect(normalizeSparqlBase("http://localhost:7878///")).toBe(
      "http://localhost:7878",
    );
  });

  test("strips /query, /update, /store, and /sparql suffixes", () => {
    expect(normalizeSparqlBase("http://localhost:7878/query")).toBe(
      "http://localhost:7878",
    );
    expect(normalizeSparqlBase("http://localhost:7878/update")).toBe(
      "http://localhost:7878",
    );
    expect(normalizeSparqlBase("http://localhost:7878/store")).toBe(
      "http://localhost:7878",
    );
    expect(normalizeSparqlBase("http://localhost:7878/sparql")).toBe(
      "http://localhost:7878",
    );
  });

  test("preserves a path segment before the suffix", () => {
    expect(normalizeSparqlBase("http://example.org/ds/sparql/query/")).toBe(
      "http://example.org/ds/sparql",
    );
  });
});

describe("sparqlEndpointUrls", () => {
  test("builds query, update, and store URLs from a bare base", () => {
    expect(sparqlEndpointUrls("http://localhost:7878")).toEqual({
      base: "http://localhost:7878",
      store: "http://localhost:7878/store",
      query: "http://localhost:7878/query",
      update: "http://localhost:7878/update",
    });
  });

  test("normalizes an endpoint URL with a path and /query suffix", () => {
    expect(sparqlEndpointUrls("http://example.org/ds/sparql/query/")).toEqual({
      base: "http://example.org/ds/sparql",
      store: "http://example.org/ds/sparql/store",
      query: "http://example.org/ds/sparql/query",
      update: "http://example.org/ds/sparql/update",
    });
  });
});

describe("graphStoreUrl", () => {
  test("targets the default graph with ?default", () => {
    expect(graphStoreUrl("http://localhost:7878/store")).toBe(
      "http://localhost:7878/store?default",
    );
  });

  test("encodes a named graph IRI", () => {
    expect(
      graphStoreUrl("http://localhost:7878/store", "http://example.org/g"),
    ).toBe(
      `http://localhost:7878/store?graph=${encodeURIComponent("http://example.org/g")}`,
    );
  });
});

describe("clearGraph", () => {
  test("rejects an invalid graph IRI before sending UPDATE", async () => {
    await expect(
      clearGraph({
        endpoint: "http://localhost:7878",
        graph: 'http://bad">iri',
      }),
    ).rejects.toThrow(InvalidIriError);
  });
});
