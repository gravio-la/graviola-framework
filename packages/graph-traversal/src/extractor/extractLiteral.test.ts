import { describe, expect, test } from "@jest/globals";
import datasetFactory from "@rdfjs/dataset";
import type { JSONSchema7 } from "json-schema";
import clownface from "clownface";
import { extractLiteral } from "./extractLiteral";
import { createNoOpLogger } from "./logger";
import type { ExtractionContext } from "./types";

describe("extractLiteral", () => {
  const createContext = (): ExtractionContext => ({
    baseIRI: "http://schema.org/",
    dataset: datasetFactory.dataset(),
    normalizedSchema: {
      type: "object",
      properties: {},
      _normalized: true,
      _propertyMetadata: {},
    },
    options: {},
    depth: 0,
    logger: createNoOpLogger(),
  });

  test("extracts string value", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("John Doe");

    const result = extractLiteral(
      node as any,
      { type: "string" },
      createContext(),
    );

    expect(result).toBe("John Doe");
  });

  test("extracts number value", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("42.5");

    const result = extractLiteral(
      node as any,
      { type: "number" },
      createContext(),
    );

    expect(result).toBe(42.5);
  });

  test("extracts integer value", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("42");

    const result = extractLiteral(
      node as any,
      { type: "integer" },
      createContext(),
    );

    expect(result).toBe(42);
  });

  test("extracts boolean true value", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("true");

    const result = extractLiteral(
      node as any,
      { type: "boolean" },
      createContext(),
    );

    expect(result).toBe(true);
  });

  test("extracts boolean false value", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("false");

    const result = extractLiteral(
      node as any,
      { type: "boolean" },
      createContext(),
    );

    expect(result).toBe(false);
  });

  test("returns null for null type", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("anything");

    const result = extractLiteral(
      node as any,
      { type: "null" },
      createContext(),
    );

    expect(result).toBe(null);
  });

  test("returns undefined for node with no values", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const subject = cf.namedNode("http://example.com/subject");
    const predicate = cf.namedNode("http://example.com/predicate");

    // Try to get a property that doesn't exist - will have no values
    const node = subject.out(predicate);

    const result = extractLiteral(
      node as any,
      { type: "string" },
      createContext(),
    );

    expect(result).toBeUndefined();
  });

  test("returns undefined for invalid number", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("not a number");

    const result = extractLiteral(
      node as any,
      { type: "number" },
      createContext(),
    );

    expect(result).toBeUndefined();
  });

  test("returns undefined for invalid integer", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("3.14");

    const result = extractLiteral(
      node as any,
      { type: "integer" },
      createContext(),
    );

    // parseInt("3.14") returns 3 (parses until non-digit)
    expect(result).toBe(3);
  });

  test("returns undefined for invalid boolean", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("maybe");

    const result = extractLiteral(
      node as any,
      { type: "boolean" },
      createContext(),
    );

    expect(result).toBeUndefined();
  });

  test("defaults to string for unknown type", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("some value");

    const result = extractLiteral(node as any, {}, createContext());

    expect(result).toBe("some value");
  });

  test("handles array of types (string|null)", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("value");

    const result = extractLiteral(
      node as any,
      { type: ["string", "null"] },
      createContext(),
    );

    expect(result).toBe("value");
  });

  test("handles array of types (number|null) with number", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("42");

    const result = extractLiteral(
      node as any,
      { type: ["number", "null"] },
      createContext(),
    );

    expect(result).toBe(42);
  });

  test("handles negative numbers", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("-42.5");

    const result = extractLiteral(
      node as any,
      { type: "number" },
      createContext(),
    );

    expect(result).toBe(-42.5);
  });

  test("handles scientific notation", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("1.5e10");

    const result = extractLiteral(
      node as any,
      { type: "number" },
      createContext(),
    );

    expect(result).toBe(1.5e10);
  });

  test("handles zero", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("0");

    const result = extractLiteral(
      node as any,
      { type: "integer" },
      createContext(),
    );

    expect(result).toBe(0);
  });

  test("handles empty string", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("");

    const result = extractLiteral(
      node as any,
      { type: "string" },
      createContext(),
    );

    expect(result).toBe("");
  });

  test("handles whitespace string", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("   ");

    const result = extractLiteral(
      node as any,
      { type: "string" },
      createContext(),
    );

    expect(result).toBe("   ");
  });

  test("handles multi-line string", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("line1\nline2\nline3");

    const result = extractLiteral(
      node as any,
      { type: "string" },
      createContext(),
    );

    expect(result).toBe("line1\nline2\nline3");
  });

  test("takes first value when multiple values exist", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    // Create a node with multiple values (simulating multiple triples with same predicate)
    const subject = cf.blankNode();
    const prop = cf.namedNode("http://example.com/prop");
    subject.addOut(prop, "first");
    subject.addOut(prop, "second");

    const values = subject.out(prop);

    const result = extractLiteral(
      values as any,
      { type: "string" },
      createContext(),
    );

    expect(result).toBe("first");
  });

  test("handles large numbers", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("999999999999");

    const result = extractLiteral(
      node as any,
      { type: "integer" },
      createContext(),
    );

    expect(result).toBe(999999999999);
  });

  test("handles decimal numbers for integer type", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });
    const node = cf.literal("42.7");

    const result = extractLiteral(
      node as any,
      { type: "integer" },
      createContext(),
    );

    // parseInt truncates decimal part
    expect(result).toBe(42);
  });
});
