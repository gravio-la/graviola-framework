/**
 * Tests for filter validation
 */

import { describe, it, expect } from "@jest/globals";
import { validateFilter } from "./filterValidator";
import type { JSONSchema7 } from "json-schema";

describe("Filter Validator", () => {
  const personSchema: JSONSchema7 = {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      age: { type: "number" },
      verified: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      address: {
        type: "object",
        properties: {
          street: { type: "string" },
          city: { type: "string" },
          zipCode: { type: "string" },
        },
      },
    },
  };

  describe("Valid filters", () => {
    it("should pass validation for valid string filters", () => {
      const where = {
        name: { contains: "John" },
        email: { endsWith: "@example.com" },
      };

      const result = validateFilter(where, personSchema, "throw");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass validation for valid numeric filters", () => {
      const where = {
        age: { gte: 18, lte: 65 },
      };

      const result = validateFilter(where, personSchema, "throw");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass validation for valid boolean filters", () => {
      const where = {
        verified: { equals: true },
      };

      const result = validateFilter(where, personSchema, "throw");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass validation for shorthand equality", () => {
      const where = {
        name: "John",
        age: 25,
      };

      const result = validateFilter(where, personSchema, "throw");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass validation for logical operators", () => {
      const where = {
        AND: [{ age: { gte: 18 } }, { verified: { equals: true } }],
      };

      const result = validateFilter(where, personSchema, "throw");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Invalid filters", () => {
    it("should detect invalid operator for string field", () => {
      const where = {
        email: { gt: 20 }, // gt is not valid for strings
      };

      const result = validateFilter(where, personSchema, "warn");
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].operator).toBe("gt");
      expect(result.errors[0].property).toBe("email");
      expect(result.errors[0].message).toContain("not valid for property");
    });

    it("should detect invalid operator for number field", () => {
      const where = {
        age: { contains: "test" }, // contains is not valid for numbers
      };

      const result = validateFilter(where, personSchema, "warn");
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].operator).toBe("contains");
      expect(result.errors[0].property).toBe("age");
    });

    it("should detect non-existent property", () => {
      const where = {
        nonExistent: { equals: "test" },
      };

      const result = validateFilter(where, personSchema, "warn");
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].property).toBe("nonExistent");
      expect(result.errors[0].message).toContain("does not exist in schema");
    });

    it("should throw error when mode is 'throw'", () => {
      const where = {
        email: { gt: 20 },
      };

      expect(() => {
        validateFilter(where, personSchema, "throw");
      }).toThrow("Filter validation failed");
    });

    it("should not throw when mode is 'warn'", () => {
      const where = {
        email: { gt: 20 },
      };

      // Should not throw, just warn
      expect(() => {
        validateFilter(where, personSchema, "warn");
      }).not.toThrow();
    });

    it("should skip validation when mode is 'ignore'", () => {
      const where = {
        email: { gt: 20 },
        nonExistent: { equals: "test" },
      };

      const result = validateFilter(where, personSchema, "ignore");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Complex filters", () => {
    it("should validate nested AND/OR conditions", () => {
      const where = {
        OR: [
          { age: { gte: 18 }, verified: true },
          { age: { lt: 18 }, name: { contains: "Junior" } },
        ],
      };

      const result = validateFilter(where, personSchema, "throw");
      expect(result.valid).toBe(true);
    });

    it("should detect errors in nested conditions", () => {
      const where = {
        AND: [
          { age: { gte: 18 } },
          { email: { gt: 100 } }, // Invalid operator
        ],
      };

      const result = validateFilter(where, personSchema, "warn");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate 'in' operator arrays", () => {
      const where = {
        name: { in: ["John", "Jane", "Bob"] },
      };

      const result = validateFilter(where, personSchema, "throw");
      expect(result.valid).toBe(true);
    });

    it("should detect invalid values in 'in' arrays", () => {
      const where = {
        age: { in: [18, 25, "invalid"] }, // Invalid: string in number array
      };

      const result = validateFilter(where, personSchema, "warn");
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("does not match schema type");
    });
  });

  describe("Union types", () => {
    const schemaWithUnion: JSONSchema7 = {
      type: "object",
      properties: {
        id: { type: ["string", "number"] },
      },
    };

    it("should allow string operators for string|number union", () => {
      const where = {
        id: { contains: "test" },
      };

      const result = validateFilter(where, schemaWithUnion, "throw");
      expect(result.valid).toBe(true);
    });

    it("should allow numeric operators for string|number union", () => {
      const where = {
        id: { gt: 100 },
      };

      const result = validateFilter(where, schemaWithUnion, "throw");
      expect(result.valid).toBe(true);
    });
  });

  describe("Date/Time filters", () => {
    it("should allow date operators for date-time format", () => {
      const where = {
        createdAt: { gte: "2024-01-01T00:00:00Z" },
      };

      const result = validateFilter(where, personSchema, "throw");
      expect(result.valid).toBe(true);
    });
  });

  describe("Backward compatibility", () => {
    it("should work without validation mode (defaults to ignore)", () => {
      const where = {
        email: { gt: 20 }, // Invalid but should be ignored
      };

      const result = validateFilter(where, personSchema);
      expect(result.valid).toBe(true);
    });
  });
});
