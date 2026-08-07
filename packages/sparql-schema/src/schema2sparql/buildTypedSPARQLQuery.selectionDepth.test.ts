import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import { SelectionTruncationError } from "@graviola/edb-graph-traversal";
import { buildFilterableSPARQLQuery } from "./buildTypedSPARQLQuery";

/** Synthetic 5-level chain: L1 → L2 → L3 → L4 → L5 */
const deepSchema = {
  type: "object",
  definitions: {
    L1: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        child: { $ref: "#/definitions/L2" },
      },
    },
    L2: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        child: { $ref: "#/definitions/L3" },
      },
    },
    L3: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        child: { $ref: "#/definitions/L4" },
      },
    },
    L4: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        child: { $ref: "#/definitions/L5" },
      },
    },
    L5: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        leaf: { type: "string" },
      },
    },
  },
} as JSONSchema7;

const fiveLevelInclude = {
  child: {
    include: {
      child: {
        include: {
          child: {
            include: {
              child: {
                select: { name: true, leaf: true },
              },
            },
          },
        },
      },
    },
  },
};

describe("buildFilterableSPARQLQuery — selection depth", () => {
  it("honours a 5-level include without explicit maxRecursion", () => {
    const l1Schema = {
      ...(deepSchema.definitions as Record<string, JSONSchema7>).L1,
      definitions: deepSchema.definitions,
    } as JSONSchema7;

    const { query } = buildFilterableSPARQLQuery(
      "http://example.org/l1/1",
      "http://example.org/L1",
      l1Schema,
      {
        include: fiveLevelInclude,
        prefixMap: { "": "http://example.org/" },
      },
    );

    // leaf property only exists at L5 — must appear in CONSTRUCT
    expect(query).toContain("leaf");
    // historical default of 4 would have truncated before L5
    expect(query.toLowerCase()).not.toContain("error");
  });

  it("throws SelectionTruncationError when maxRecursion truncates include", () => {
    const l1Schema = {
      ...(deepSchema.definitions as Record<string, JSONSchema7>).L1,
      definitions: deepSchema.definitions,
    } as JSONSchema7;

    expect(() =>
      buildFilterableSPARQLQuery(
        "http://example.org/l1/1",
        "http://example.org/L1",
        l1Schema,
        {
          include: fiveLevelInclude,
          maxRecursion: 2,
          prefixMap: { "": "http://example.org/" },
        },
      ),
    ).toThrow(SelectionTruncationError);
  });

  it("binds multiple subjects with VALUES", () => {
    const itemSchema = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
      },
    } as JSONSchema7;

    const { query } = buildFilterableSPARQLQuery(
      ["http://example.org/a", "http://example.org/b"],
      "http://example.org/Item",
      itemSchema,
      { prefixMap: { "": "http://example.org/" } },
    );

    expect(query).toMatch(/VALUES/i);
    expect(query).toContain("http://example.org/a");
    expect(query).toContain("http://example.org/b");
  });
});
