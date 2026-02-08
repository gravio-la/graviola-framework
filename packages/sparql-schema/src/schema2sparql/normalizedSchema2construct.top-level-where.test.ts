/**
 * Top-level WHERE clause filtering tests for normalizedSchema2construct
 *
 * Tests filtering the main entity's properties using top-level where clauses
 */

import { describe, test, expect } from "bun:test";
import { JSONSchema7 } from "json-schema";
import { normalizeSchema } from "@graviola/edb-graph-traversal";
import { normalizedSchema2construct } from "./normalizedSchema2construct";

describe("normalizedSchema2construct - Top-Level WHERE Filters", () => {
  describe("Basic top-level property filtering", () => {
    test("filters main entity by node reference (@id)", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          geoFeature: {
            type: "object",
            properties: {
              "@id": { type: "string" },
              name: { type: "string" },
            },
          },
        },
      };

      const filterOptions = {
        where: {
          geoFeature: {
            "@id":
              "https://ontology.semantic-desk.top/garden#GeoFeature/25jy3nxgouo",
          },
        },
      };

      const normalized = normalizeSchema(schema, filterOptions);
      const result = normalizedSchema2construct(
        undefined,
        undefined,
        normalized,
        {
          filterOptions,
          prefixMap: {
            "": "https://ontology.semantic-desk.top/garden#",
          },
        },
      );

      const whereString = result.wherePatterns
        .map((p) => p.toString())
        .join("\n");

      // Should have filter for geoFeature with specific IRI
      expect(whereString).toContain("geoFeature");
      expect(whereString).toContain("25jy3nxgouo");
    });

    test("filters main entity by primitive property value", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          verified: { type: "boolean" },
        },
      };

      const filterOptions = {
        where: {
          age: { gte: 18 },
          verified: { equals: true },
        },
      };

      const normalized = normalizeSchema(schema, filterOptions);
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
        {
          filterOptions,
        },
      );

      const whereString = result.wherePatterns
        .map((p) => p.toString())
        .join("\n");

      // Should have filters for age and verified
      expect(whereString.toLowerCase()).toContain("age");
      expect(whereString.toLowerCase()).toContain("filter");
    });

    test("filters main entity by string contains", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
      };

      const filterOptions = {
        where: {
          email: { contains: "@example.com" },
        },
      };

      const normalized = normalizeSchema(schema, filterOptions);
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
        {
          filterOptions,
        },
      );

      const whereString = result.wherePatterns
        .map((p) => p.toString())
        .join("\n");

      // Should have filter for email
      expect(whereString.toLowerCase()).toContain("email");
      expect(whereString.toLowerCase()).toContain("filter");
      expect(whereString.toLowerCase()).toContain("contains");
    });
  });

  describe("Complex top-level WHERE filters", () => {
    test("combines multiple property filters with AND", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          city: { type: "string" },
        },
      };

      const filterOptions = {
        where: {
          AND: [
            { age: { gte: 18 } },
            { age: { lte: 65 } },
            { city: { equals: "Berlin" } },
          ],
        },
      };

      const normalized = normalizeSchema(schema, filterOptions);
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
        {
          filterOptions,
        },
      );

      const whereString = result.wherePatterns
        .map((p) => p.toString())
        .join("\n");

      // Should have filters for age and city
      expect(whereString.toLowerCase()).toContain("age");
      expect(whereString.toLowerCase()).toContain("city");
    });

    test("combines top-level WHERE with relationship include filters", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
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

      const filterOptions = {
        where: {
          age: { gte: 18 }, // Filter main entity
        },
        include: {
          friends: {
            where: {
              some: {
                age: { gte: 21 }, // Filter related entities
              },
            },
          },
        },
      };

      const normalized = normalizeSchema(schema, filterOptions);
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
        {
          filterOptions,
        },
      );

      const whereString = result.wherePatterns
        .map((p) => p.toString())
        .join("\n");

      // Should have filters for both main entity and relationships
      expect(whereString).toContain("age");
      expect(whereString).toContain("friends");
    });
  });

  describe("Multiple properties with top-level WHERE", () => {
    test("filters multiple properties on main entity", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          category: {
            type: "object",
            properties: {
              "@id": { type: "string" },
              name: { type: "string" },
            },
          },
          status: {
            type: "object",
            properties: {
              "@id": { type: "string" },
              name: { type: "string" },
            },
          },
        },
      };

      const filterOptions = {
        where: {
          category: {
            "@id": "http://example.com/category/tech",
          },
          status: {
            "@id": "http://example.com/status/active",
          },
        },
      };

      const normalized = normalizeSchema(schema, filterOptions);
      const result = normalizedSchema2construct(
        undefined,
        undefined,
        normalized,
        {
          filterOptions,
        },
      );

      const whereString = result.wherePatterns
        .map((p) => p.toString())
        .join("\n");

      // Should have filters for both category and status
      expect(whereString).toContain("category");
      expect(whereString).toContain("status");
      expect(whereString).toContain("tech");
      expect(whereString).toContain("active");
    });
  });

  describe("Edge cases", () => {
    test("handles empty WHERE clause", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      };

      const filterOptions = {
        where: {},
      };

      const normalized = normalizeSchema(schema, filterOptions);
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
        {
          filterOptions,
        },
      );

      // Should not throw
      expect(result.constructPatterns).toBeDefined();
      expect(result.wherePatterns).toBeDefined();
    });

    test("handles undefined WHERE clause", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      // Should not throw
      expect(result.constructPatterns).toBeDefined();
      expect(result.wherePatterns).toBeDefined();
    });

    test("handles WHERE on property that doesn't exist in schema", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      };

      const filterOptions = {
        where: {
          nonExistent: { equals: "value" },
        },
      };

      const normalized = normalizeSchema(schema, filterOptions);
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
        {
          filterOptions,
        },
      );

      // Should not crash - normalizeSchema might have removed the property
      expect(result.constructPatterns).toBeDefined();
      expect(result.wherePatterns).toBeDefined();
    });
  });
});
