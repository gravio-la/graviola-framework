import { describe, it, expect } from "vitest";
import {
  buildTypedSPARQLQuery,
  buildTypedSPARQLQueryBatch,
} from "./buildTypedSPARQLQuery";
import type { JSONSchema7 } from "json-schema";

describe("buildTypedSPARQLQuery - Batch Queries", () => {
  const personSchema: JSONSchema7 = {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" },
      email: { type: "string" },
    },
  };

  describe("buildTypedSPARQLQueryBatch", () => {
    it("should generate query with VALUES for multiple subjects", () => {
      const result = buildTypedSPARQLQueryBatch(
        [
          "http://example.com/person/1",
          "http://example.com/person/2",
          "http://example.com/person/3",
        ],
        personSchema,
        {
          prefixMap: { "": "http://example.com/" },
        },
      );

      expect(result.query).toContain("VALUES");
      expect(result.query).toContain("?subject");
      expect(result.query).toContain("<http://example.com/person/1>");
      expect(result.query).toContain("<http://example.com/person/2>");
      expect(result.query).toContain("<http://example.com/person/3>");
    });

    it("should throw error for empty array", () => {
      expect(() => {
        buildTypedSPARQLQueryBatch([], personSchema);
      }).toThrow("At least one subject IRI is required");
    });

    it("should work with select pattern", () => {
      const result = buildTypedSPARQLQueryBatch(
        ["http://example.com/person/1", "http://example.com/person/2"],
        personSchema,
        {
          select: { name: true, age: true },
          prefixMap: { "": "http://example.com/" },
        },
      );

      expect(result.query).toContain("VALUES");
      expect(result.query).toContain(":name");
      expect(result.query).toContain(":age");
      expect(result.query).not.toContain(":email");
    });

    it("should work with where filters", () => {
      const result = buildTypedSPARQLQueryBatch(
        ["http://example.com/person/1", "http://example.com/person/2"],
        personSchema,
        {
          where: {
            age: { gte: 18 },
          },
          prefixMap: { "": "http://example.com/" },
        },
      );

      expect(result.query).toContain("VALUES");
      expect(result.query).toContain("?subject");
      // WHERE filters should be applied to all subjects
      expect(result.query).toContain(":age");
    });

    it("should work with nested includes", () => {
      const schemaWithRelations: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          friends: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                age: { type: "number" },
              },
            },
          },
        },
      };

      const result = buildTypedSPARQLQueryBatch(
        ["http://example.com/person/1", "http://example.com/person/2"],
        schemaWithRelations,
        {
          include: {
            friends: { take: 5, orderBy: { name: "asc" } },
          },
          prefixMap: { "": "http://example.com/" },
        },
      );

      expect(result.query).toContain("VALUES");
      expect(result.query).toContain("?subject");
      expect(result.query).toContain(":friends");
      expect(result.query).toContain("LIMIT 5");
    });

    it("should handle prefixed IRIs in batch", () => {
      const result = buildTypedSPARQLQueryBatch(
        ["ex:person1", "ex:person2", "ex:person3"],
        personSchema,
        {
          prefixMap: {
            "": "http://example.com/",
            ex: "http://example.com/",
          },
        },
      );

      expect(result.query).toContain("VALUES");
      expect(result.query).toContain("?subject");
      expect(result.query).toContain("ex:person1");
      expect(result.query).toContain("ex:person2");
      expect(result.query).toContain("ex:person3");
    });

    it("should handle mix of full and prefixed IRIs", () => {
      const result = buildTypedSPARQLQueryBatch(
        ["http://example.com/person/1", "ex:person2", "urn:uuid:12345-67890"],
        personSchema,
        {
          prefixMap: {
            "": "http://example.com/",
            ex: "http://example.com/",
          },
        },
      );

      expect(result.query).toContain("VALUES");
      expect(result.query).toContain("?subject");
      expect(result.query).toContain("<http://example.com/person/1>");
      expect(result.query).toContain("ex:person2");
      expect(result.query).toContain("<urn:uuid:12345-67890>");
    });

    it("should work with flavour option", () => {
      const result = buildTypedSPARQLQueryBatch(
        ["http://example.com/person/1", "http://example.com/person/2"],
        personSchema,
        {
          flavour: "default",
          prefixMap: { "": "http://example.com/" },
        },
      );

      expect(result.query).toContain("VALUES");
      expect(result.query).toContain("?subject");
    });
  });

  describe("buildTypedSPARQLQuery with array", () => {
    it("should accept array of subjects", () => {
      const result = buildTypedSPARQLQuery(
        ["http://example.com/person/1", "http://example.com/person/2"],
        personSchema,
        {
          prefixMap: { "": "http://example.com/" },
        },
      );

      expect(result.query).toContain("VALUES");
      expect(result.query).toContain("?subject");
      expect(result.query).toContain("<http://example.com/person/1>");
      expect(result.query).toContain("<http://example.com/person/2>");
    });

    it("should accept single subject string", () => {
      const result = buildTypedSPARQLQuery(
        "http://example.com/person/1",
        personSchema,
        {
          prefixMap: { "": "http://example.com/" },
        },
      );

      expect(result.query).toContain("VALUES");
      expect(result.query).toContain("?subject");
      expect(result.query).toContain("<http://example.com/person/1>");
    });

    it("should use BIND for single subject with oxigraph flavour", () => {
      const result = buildTypedSPARQLQuery(
        "http://example.com/person/1",
        personSchema,
        {
          flavour: "oxigraph",
          prefixMap: { "": "http://example.com/" },
        },
      );

      expect(result.query).toContain("BIND");
      expect(result.query).toContain("?subject");
      expect(result.query).toContain("<http://example.com/person/1>");
    });

    it("should use VALUES for multiple subjects even with oxigraph flavour", () => {
      const result = buildTypedSPARQLQuery(
        ["http://example.com/person/1", "http://example.com/person/2"],
        personSchema,
        {
          flavour: "oxigraph",
          prefixMap: { "": "http://example.com/" },
        },
      );

      // Multiple subjects should override oxigraph preference and use VALUES
      expect(result.query).toContain("VALUES");
      expect(result.query).not.toContain("BIND");
      expect(result.query).toContain("?subject");
    });
  });

  describe("Performance optimization scenarios", () => {
    it("should use BIND for single subject when performance matters (oxigraph)", () => {
      const result = buildTypedSPARQLQuery(
        "http://example.com/person/1",
        personSchema,
        {
          flavour: "oxigraph",
        },
      );

      expect(result.query).toContain("BIND");
      expect(result.query).toContain("?subject");
    });

    it("should use VALUES for batch operations regardless of flavour", () => {
      const result = buildTypedSPARQLQuery(
        [
          "http://example.com/person/1",
          "http://example.com/person/2",
          "http://example.com/person/3",
        ],
        personSchema,
        {
          flavour: "oxigraph",
        },
      );

      expect(result.query).toContain("VALUES");
      expect(result.query).not.toContain("BIND");
    });
  });
});
