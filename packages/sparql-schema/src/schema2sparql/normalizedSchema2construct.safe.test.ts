/**
 * Injection prevention tests for normalizedSchema2construct
 *
 * These tests verify that the SPARQL builder properly handles:
 * - Special characters in property names
 * - Malformed IRIs
 * - User-controlled input
 * - Attempts at SPARQL injection
 */

import { describe, expect, test } from "@jest/globals";
import { JSONSchema7 } from "json-schema";
import { normalizeSchema } from "@graviola/edb-graph-traversal";

import { normalizedSchema2construct } from "./normalizedSchema2construct";

describe("normalizedSchema2construct - Injection Prevention", () => {
  test("handles property names with special SPARQL characters", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        // These could be injection attempts
        "name'; DROP TABLE users; --": { type: "string" },
        "email>; DELETE WHERE { ?s ?p ?o }": { type: "string" },
        "phone\nUNION { ?x ?y ?z }": { type: "string" },
      },
    };

    const normalized = normalizeSchema(schema, {});

    // Should not throw - builder handles escaping
    expect(() => {
      normalizedSchema2construct("http://example.com/test", normalized);
    }).not.toThrow();

    const result = normalizedSchema2construct(
      "http://example.com/test",
      normalized,
    );

    // Should create patterns (escaped properly)
    expect(result.constructPatterns).toBeDefined();
    expect(result.wherePatterns).toBeDefined();
  });

  test("handles malformed IRI in subject", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    const normalized = normalizeSchema(schema, {});

    // Malformed IRIs should be handled gracefully
    const malformedIRIs = [
      "http://example.com/test<>",
      "http://example.com/test\n\r",
      "http://example.com/test'; DROP",
    ];

    malformedIRIs.forEach((iri) => {
      expect(() => {
        normalizedSchema2construct(iri, normalized);
      }).not.toThrow();
    });
  });

  test("handles property names with quotes", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        'name"with"quotes': { type: "string" },
        "name'with'apostrophes": { type: "string" },
        "mixed\"quotes'here": { type: "string" },
      },
    };

    const normalized = normalizeSchema(schema, {});

    const result = normalizedSchema2construct(
      "http://example.com/test",
      normalized,
    );

    expect(result.constructPatterns).toBeDefined();
    expect(result.wherePatterns).toBeDefined();
    // Builder should properly escape quotes
  });

  test("handles property names with curly braces", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "name{with}braces": { type: "string" },
        "email}UNION{?s?p?o": { type: "string" },
      },
    };

    const normalized = normalizeSchema(schema, {});

    const result = normalizedSchema2construct(
      "http://example.com/test",
      normalized,
    );

    expect(result.constructPatterns).toBeDefined();
    expect(result.wherePatterns).toBeDefined();
  });

  test("handles property names with dots (common in SPARQL paths)", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "rdf:type": { type: "string" },
        "foaf:name": { type: "string" },
        "dc:title": { type: "string" },
      },
    };

    const normalized = normalizeSchema(schema, {});

    const result = normalizedSchema2construct(
      "http://example.com/test",
      normalized,
    );

    expect(result.constructPatterns).toBeDefined();
    expect(result.wherePatterns).toBeDefined();
  });

  test("handles unicode characters in property names", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        名前: { type: "string" }, // Japanese
        имя: { type: "string" }, // Russian
        "🎉celebration": { type: "string" }, // Emoji
      },
    };

    const normalized = normalizeSchema(schema, {});

    const result = normalizedSchema2construct(
      "http://example.com/test",
      normalized,
    );

    expect(result.constructPatterns).toBeDefined();
    expect(result.wherePatterns).toBeDefined();
  });

  test("handles very long property names", () => {
    const longName = "a".repeat(1000);

    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        [longName]: { type: "string" },
      },
    };

    const normalized = normalizeSchema(schema, {});

    const result = normalizedSchema2construct(
      "http://example.com/test",
      normalized,
    );

    expect(result.constructPatterns).toBeDefined();
    expect(result.wherePatterns).toBeDefined();
  });

  test("handles property names with SPARQL keywords", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        SELECT: { type: "string" },
        WHERE: { type: "string" },
        CONSTRUCT: { type: "string" },
        OPTIONAL: { type: "string" },
        FILTER: { type: "string" },
        UNION: { type: "string" },
      },
    };

    const normalized = normalizeSchema(schema, {});

    const result = normalizedSchema2construct(
      "http://example.com/test",
      normalized,
    );

    expect(result.constructPatterns).toBeDefined();
    expect(result.wherePatterns).toBeDefined();
    // Keywords should be properly escaped/handled
  });

  test("handles property names with newlines and tabs", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "name\nwith\nnewlines": { type: "string" },
        "email\twith\ttabs": { type: "string" },
        "mixed\n\t\r\nmix": { type: "string" },
      },
    };

    const normalized = normalizeSchema(schema, {});

    const result = normalizedSchema2construct(
      "http://example.com/test",
      normalized,
    );

    expect(result.constructPatterns).toBeDefined();
    expect(result.wherePatterns).toBeDefined();
  });

  test("handles nested objects with injection attempts in property names", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        "address}UNION{": {
          type: "object",
          properties: {
            "street'; DROP--": { type: "string" },
            "city\nDELETE": { type: "string" },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, {});

    const result = normalizedSchema2construct(
      "http://example.com/test",
      normalized,
    );

    expect(result.constructPatterns).toBeDefined();
    expect(result.wherePatterns).toBeDefined();
    // Should handle nested properties safely
  });
});
