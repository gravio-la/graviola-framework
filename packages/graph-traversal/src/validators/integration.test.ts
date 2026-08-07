/**
 * Integration tests for filter validation with buildTraversalSchema
 */

import { describe, it, expect } from "@jest/globals";
import { buildTraversalSchema } from "../traversal-schema";
import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";

describe("Filter Validation Integration", () => {
  const schema: JSONSchema7 = {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      age: { type: "number" },
      verified: { type: "boolean" },
      tags: {
        type: "array",
        items: { type: "string" },
      },
    },
  };

  describe("buildTraversalSchema with filter validation", () => {
    it("should validate filters during schema preparation (throw mode)", () => {
      const options: GraphTraversalFilterOptions = {
        where: {
          email: { gt: 20 }, // Invalid: gt on string
        },
        filterValidationMode: "throw",
      };

      expect(() => {
        buildTraversalSchema(schema, options);
      }).toThrow("Filter validation failed");
    });

    it("should validate filters during schema preparation (warn mode)", () => {
      const options: GraphTraversalFilterOptions = {
        where: {
          email: { gt: 20 }, // Invalid but should only warn
        },
        filterValidationMode: "warn",
      };

      // Should not throw, just warn (logs to console)
      expect(() => {
        buildTraversalSchema(schema, options);
      }).not.toThrow();
    });

    it("should skip validation when mode is ignore", () => {
      const options: GraphTraversalFilterOptions = {
        where: {
          email: { gt: 20 }, // Invalid but ignored
        },
        filterValidationMode: "ignore",
      };

      const result = buildTraversalSchema(schema, options);
      expect(result).toBeDefined();
    });

    it("should skip validation when mode is not set", () => {
      const options: GraphTraversalFilterOptions = {
        where: {
          email: { gt: 20 }, // Invalid but no validation mode set
        },
      };

      const result = buildTraversalSchema(schema, options);
      expect(result).toBeDefined();
    });

    it("should pass validation for valid filters", () => {
      const options: GraphTraversalFilterOptions = {
        where: {
          name: { contains: "John" },
          age: { gte: 18, lte: 65 },
          verified: { equals: true },
        },
        filterValidationMode: "throw",
      };

      const result = buildTraversalSchema(schema, options);
      expect(result).toBeDefined();
      expect(result._traversalSchema).toBe(true);
    });
  });

  describe("Complex filter scenarios", () => {
    it("should validate complex nested filters", () => {
      const options: GraphTraversalFilterOptions = {
        where: {
          AND: [
            { age: { gte: 18 } },
            {
              OR: [
                { name: { contains: "John" } },
                { email: { endsWith: "@example.com" } },
              ],
            },
          ],
        },
        filterValidationMode: "throw",
      };

      const result = buildTraversalSchema(schema, options);
      expect(result).toBeDefined();
    });

    it("should detect invalid operators in nested conditions", () => {
      const options: GraphTraversalFilterOptions = {
        where: {
          AND: [
            { age: { gte: 18 } },
            { name: { gt: 100 } }, // Invalid: gt on string
          ],
        },
        filterValidationMode: "throw",
      };

      expect(() => {
        buildTraversalSchema(schema, options);
      }).toThrow();
    });
  });

  describe("Schema with $refs", () => {
    const schemaWithRefs: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        address: { $ref: "#/$defs/Address" },
      },
      $defs: {
        Address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            zipCode: { type: "string" },
          },
        },
      },
    };

    it("should validate filters after resolving refs", () => {
      const options: GraphTraversalFilterOptions = {
        where: {
          name: { contains: "John" },
        },
        filterValidationMode: "throw",
      };

      const result = buildTraversalSchema(schemaWithRefs, options);
      expect(result).toBeDefined();
    });
  });

  describe("Phase 3 preparation", () => {
    it("should document that nested filter validation will be enhanced", () => {
      // Phase 3 will add validation at each level of the schema tree
      // as we traverse through nested objects and relationships

      // This is a placeholder test documenting the future enhancement
      const futureNote = `
        Phase 3 will integrate validation into the complete SPARQL 
        CONSTRUCT query builder, validating nested filters at each 
        level of recursion as we walk through the schema tree.
        
        This will allow validation of filters on nested properties:
        - Filters on nested objects
        - Filters on array elements
        - Filters at different depths of the schema
      `;

      expect(futureNote).toBeDefined();
    });
  });
});
