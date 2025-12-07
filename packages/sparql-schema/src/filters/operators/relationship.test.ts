/**
 * Unit tests for relationship filter operators
 * Tests: some, every, none
 */

import { describe, expect, test } from "@jest/globals";
import df from "@rdfjs/data-model";
import type { FilterContext } from "../types";
import {
  applySomeOperator,
  applyEveryOperator,
  applyNoneOperator,
  applyRelationshipOperator,
} from "./relationship";

// Helper to create a basic filter context
const createContext = (property: string = "knows"): FilterContext => {
  return {
    subject: df.variable("person"),
    property,
    propertyVar: df.variable(property),
    predicateNode: df.namedNode(`http://example.com/${property}`),
    schemaType: "array",
    prefixMap: { ex: "http://example.com/", "": "http://default.example.com/" },
    flavour: "default",
    depth: 0,
  };
};

describe("Relationship Filter Operators", () => {
  describe("applySomeOperator", () => {
    test("handles simple @id node reference with full IRI", () => {
      const context = createContext("knows");
      const filterValue = { "@id": "http://example.com/friend1" };

      const result = applySomeOperator(filterValue, context);

      expect(result.patterns).toHaveLength(1);
      expect(result.filters).toHaveLength(0);
      expect(result.optional).toBe(false);

      const patternStr = result.patterns[0].toString();
      expect(patternStr).toContain("?person");
      expect(patternStr).toContain("knows");
      expect(patternStr).toContain("http://example.com/friend1");
    });

    test("handles @id with prefixed IRI", () => {
      const context = createContext("knows");
      const filterValue = { "@id": "ex:friend1" };

      const result = applySomeOperator(filterValue, context);

      expect(result.patterns).toHaveLength(1);
      const patternStr = result.patterns[0].toString();
      expect(patternStr).toContain("ex:friend1");
    });

    test("handles @id with default prefix", () => {
      const context = createContext("knows");
      const filterValue = { "@id": ":friend1" };

      const result = applySomeOperator(filterValue, context);

      expect(result.patterns).toHaveLength(1);
      const patternStr = result.patterns[0].toString();
      expect(patternStr).toContain(":friend1");
    });

    test("handles @id with URN", () => {
      const context = createContext("knows");
      const filterValue = { "@id": "urn:uuid:12345" };

      const result = applySomeOperator(filterValue, context);

      expect(result.patterns).toHaveLength(1);
      const patternStr = result.patterns[0].toString();
      expect(patternStr).toContain("urn:uuid:12345");
    });

    test("handles nested filter object (basic case)", () => {
      const context = createContext("knows");
      const filterValue = { name: "John" };

      const result = applySomeOperator(filterValue, context);

      // For now, this just creates the base relationship pattern
      // Complex nested filtering will be implemented in future iterations
      expect(result.patterns).toHaveLength(1);
      expect(result.filters).toHaveLength(0);
    });
  });

  describe("applyEveryOperator", () => {
    test("handles array of @id node references", () => {
      const context = createContext("knows");
      const filterValues = [
        { "@id": "http://example.com/friend1" },
        { "@id": "http://example.com/friend2" },
      ];

      const result = applyEveryOperator(filterValues, context);

      expect(result.patterns).toHaveLength(2);
      expect(result.filters).toHaveLength(0);
      expect(result.optional).toBe(false);

      const patterns = result.patterns.map((p) => p.toString());
      expect(patterns[0]).toContain("friend1");
      expect(patterns[1]).toContain("friend2");
    });

    test("handles array with prefixed IRIs", () => {
      const context = createContext("knows");
      const filterValues = [{ "@id": "ex:friend1" }, { "@id": "ex:friend2" }];

      const result = applyEveryOperator(filterValues, context);

      expect(result.patterns).toHaveLength(2);
      const patterns = result.patterns.map((p) => p.toString());
      expect(patterns[0]).toContain("ex:friend1");
      expect(patterns[1]).toContain("ex:friend2");
    });

    test("throws error for non-array input", () => {
      const context = createContext("knows");
      const filterValue = { "@id": "http://example.com/friend1" };

      expect(() => {
        applyEveryOperator(filterValue as any, context);
      }).toThrow("'every' operator requires an array");
    });

    test("throws error for non-node-reference items", () => {
      const context = createContext("knows");
      const filterValues = [{ name: "John" }];

      expect(() => {
        applyEveryOperator(filterValues, context);
      }).toThrow("'every' operator currently only supports node references");
    });

    test("handles empty array", () => {
      const context = createContext("knows");
      const filterValues: any[] = [];

      const result = applyEveryOperator(filterValues, context);

      expect(result.patterns).toHaveLength(0);
      expect(result.filters).toHaveLength(0);
    });
  });

  describe("applyNoneOperator", () => {
    test("handles simple @id node reference with full IRI", () => {
      const context = createContext("knows");
      const filterValue = { "@id": "http://example.com/blocked" };

      const result = applyNoneOperator(filterValue, context);

      expect(result.patterns).toHaveLength(1);
      expect(result.filters).toHaveLength(0);
      expect(result.optional).toBe(false);

      const patternStr = result.patterns[0].toString();
      expect(patternStr).toContain("FILTER NOT EXISTS");
      expect(patternStr).toContain("?person");
      expect(patternStr).toContain("blocked");
    });

    test("handles @id with prefixed IRI", () => {
      const context = createContext("knows");
      const filterValue = { "@id": "ex:blocked" };

      const result = applyNoneOperator(filterValue, context);

      expect(result.patterns).toHaveLength(1);
      const patternStr = result.patterns[0].toString();
      expect(patternStr).toContain("FILTER NOT EXISTS");
      expect(patternStr).toContain("ex:blocked");
    });

    test("handles array of @id node references", () => {
      const context = createContext("knows");
      const filterValues = [
        { "@id": "http://example.com/blocked1" },
        { "@id": "http://example.com/blocked2" },
      ];

      const result = applyNoneOperator(filterValues, context);

      expect(result.patterns).toHaveLength(1);
      const patternStr = result.patterns[0].toString();
      expect(patternStr).toContain("FILTER NOT EXISTS");
      expect(patternStr).toContain("VALUES");
    });

    test("handles nested filter object", () => {
      const context = createContext("knows");
      const filterValue = { name: "Blocked" };

      const result = applyNoneOperator(filterValue, context);

      expect(result.patterns).toHaveLength(1);
      const patternStr = result.patterns[0].toString();
      expect(patternStr).toContain("FILTER NOT EXISTS");
    });
  });

  describe("applyRelationshipOperator (dispatcher)", () => {
    test("dispatches to applySomeOperator", () => {
      const context = createContext("knows");
      const filterValue = { "@id": "http://example.com/friend" };

      const result = applyRelationshipOperator("some", filterValue, context);

      expect(result.patterns).toHaveLength(1);
      expect(result.filters).toHaveLength(0);
    });

    test("dispatches to applyEveryOperator", () => {
      const context = createContext("knows");
      const filterValues = [
        { "@id": "http://example.com/friend1" },
        { "@id": "http://example.com/friend2" },
      ];

      const result = applyRelationshipOperator("every", filterValues, context);

      expect(result.patterns).toHaveLength(2);
    });

    test("dispatches to applyNoneOperator", () => {
      const context = createContext("knows");
      const filterValue = { "@id": "http://example.com/blocked" };

      const result = applyRelationshipOperator("none", filterValue, context);

      expect(result.patterns).toHaveLength(1);
      const patternStr = result.patterns[0].toString();
      expect(patternStr).toContain("FILTER NOT EXISTS");
    });
  });

  describe("IRI format handling", () => {
    test("handles various IRI formats consistently", () => {
      const context = createContext("knows");

      // Full IRI
      const fullIRI = applySomeOperator(
        { "@id": "http://example.com/person1" },
        context,
      );
      expect(fullIRI.patterns[0].toString()).toContain(
        "http://example.com/person1",
      );

      // Prefixed IRI
      const prefixed = applySomeOperator({ "@id": "ex:person1" }, context);
      expect(prefixed.patterns[0].toString()).toContain("ex:person1");

      // Default prefix
      const defaultPrefix = applySomeOperator({ "@id": ":person1" }, context);
      expect(defaultPrefix.patterns[0].toString()).toContain(":person1");

      // URN
      const urn = applySomeOperator({ "@id": "urn:isbn:0451450523" }, context);
      expect(urn.patterns[0].toString()).toContain("urn:isbn:0451450523");
    });
  });
});
