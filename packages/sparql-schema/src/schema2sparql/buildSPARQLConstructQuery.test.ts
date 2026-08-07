import { describe, it, expect } from "bun:test";
import { buildTraversalSchema } from "@graviola/edb-graph-traversal";
import { traversalSchema2construct } from "./traversalSchema2construct";
import { buildSPARQLConstructQuery } from "./buildSPARQLConstructQuery";
import type { JSONSchema7 } from "json-schema";

describe("buildCompleteSPARQLQuery", () => {
  it("should add dots after triples in CONSTRUCT clause", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };

    const normalized = buildTraversalSchema(schema);
    const result = traversalSchema2construct(
      "http://example.com/person/1",
      undefined,
      normalized,
    );
    const query = buildSPARQLConstructQuery(result, {
      "": "http://example.com/",
    });

    // Check that CONSTRUCT patterns have dots (variables include depth suffix)
    expect(query).toContain("CONSTRUCT");
    expect(query).toMatch(/:name \?name_\d+ \./);
    expect(query).toMatch(/:age \?age_\d+ \./);
  });

  it("should add dots after patterns in WHERE clause", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
    };

    const normalized = buildTraversalSchema(schema);
    const result = traversalSchema2construct(
      "http://example.com/person/1",
      undefined,
      normalized,
    );
    const query = buildSPARQLConstructQuery(result, {
      "": "http://example.com/",
    });

    // Check that WHERE patterns have dots inside OPTIONAL blocks (correct SPARQL syntax)
    expect(query).toContain("WHERE");
    // Subject is now a variable with VALUES clause binding it to the IRI
    expect(query).toContain("VALUES ?subject");
    expect(query).toContain("<http://example.com/person/1>");
    expect(query).toMatch(/OPTIONAL \{ \?subject :name \?name_\d+ \. \}/);
  });

  it("should handle pagination with LATERAL correctly", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        friends: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
          "x-pagination": {
            take: 10,
            orderBy: { name: "asc" },
          },
        },
      },
    };

    const filterOptions = {
      include: {
        friends: {
          take: 10,
          orderBy: { name: "asc" },
        },
      },
    };

    const normalized = buildTraversalSchema(schema, filterOptions);
    const result = traversalSchema2construct(
      "http://example.com/person/1",
      undefined,
      normalized,
      {
        flavour: "oxigraph",
        filterOptions,
      },
    );
    const query = buildSPARQLConstructQuery(result, {
      "": "http://example.com/",
    });

    // LATERAL SELECT with pagination (oxigraph: BIND + LATERAL)
    expect(query).toContain("LATERAL");
    expect(query).toContain("SELECT");
    expect(query).toContain("ORDER BY");
    expect(query).toContain("LIMIT 10");

    expect(query).toContain("BIND(");
    expect(query).toContain("<http://example.com/person/1>");
    expect(query).toMatch(/\?subject :friends \?friends_\d+ \./);
    expect(query).toMatch(/OPTIONAL \{ \?friends_\d+ :name \?name_\d+ \. \}/);
  });
});
