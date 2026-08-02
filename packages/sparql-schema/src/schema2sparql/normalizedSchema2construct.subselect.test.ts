import { describe, test, expect } from "bun:test";
import { JSONSchema7 } from "json-schema";
import { normalizeSchema } from "@graviola/edb-graph-traversal";
import { normalizedSchema2construct } from "./normalizedSchema2construct";

const friendsSchema: JSONSchema7 = {
  type: "object",
  properties: {
    friends: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
    },
  },
};

function whereString(
  result: ReturnType<typeof normalizedSchema2construct>,
): string {
  return result.wherePatterns.map((p) => p.toString()).join("\n");
}

describe("normalizedSchema2construct — pagination flavours", () => {
  test("default flavour: no SUBSELECT / LIMIT for include.take", () => {
    const filterOptions = {
      include: {
        friends: { take: 10, orderBy: { name: "asc" as const } },
      },
    };
    const normalized = normalizeSchema(friendsSchema, filterOptions);
    const result = normalizedSchema2construct(
      "http://example.com/person1",
      undefined,
      normalized,
      { filterOptions, flavour: "default" },
    );

    const where = whereString(result);
    expect(where).not.toContain("LATERAL");
    // Plain OPTIONAL triple — no nested SELECT LIMIT
    expect(where).not.toMatch(/SELECT[\s\S]*LIMIT/);
    expect(result.paginationMetadata.get("friends")?._stage).toBe("extraction");
    expect(result.paginationMetadata.get("friends")?.take).toBe(10);
  });

  test("lateral flavour: emits LATERAL with projected subject + LIMIT", () => {
    const filterOptions = {
      include: {
        friends: { take: 10, orderBy: { name: "asc" as const } },
      },
    };
    const normalized = normalizeSchema(friendsSchema, filterOptions);
    const result = normalizedSchema2construct(
      "http://example.com/person1",
      undefined,
      normalized,
      { filterOptions, flavour: "lateral" },
    );

    const where = whereString(result);
    expect(where).toContain("LATERAL");
    expect(where).toContain("SELECT");
    expect(where).toContain("ORDER BY");
    expect(where).toContain("LIMIT");
    // Subject must be projected (appears twice in SELECT list conceptually)
    expect(where).toMatch(/SELECT\s+\?subject\b/);
    expect(result.paginationMetadata.get("friends")?._stage).toBe("query");
  });

  test("lateral: multiple ORDER BY + OFFSET", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              createdAt: { type: "string" },
              title: { type: "string" },
            },
          },
        },
      },
    };
    const filterOptions = {
      include: {
        posts: {
          take: 20,
          skip: 5,
          orderBy: [{ createdAt: "desc" as const }, { title: "asc" as const }],
        },
      },
    };
    const normalized = normalizeSchema(schema, filterOptions);
    const result = normalizedSchema2construct(
      "http://example.com/blog1",
      undefined,
      normalized,
      { filterOptions, flavour: "lateral" },
    );
    const where = whereString(result);
    expect(where).toContain("LATERAL");
    expect(where).toContain("LIMIT 20");
    expect(where).toContain("OFFSET 5");
    expect(where).toContain("ORDER BY");
  });

  test("lateral: LIMIT only (no ORDER BY)", () => {
    const filterOptions = { include: { friends: { take: 5 } } };
    const normalized = normalizeSchema(friendsSchema, filterOptions);
    const result = normalizedSchema2construct(
      "http://example.com/person1",
      undefined,
      normalized,
      { filterOptions, flavour: "lateral" },
    );
    const where = whereString(result);
    expect(where).toContain("LATERAL");
    expect(where).toContain("LIMIT 5");
  });

  test("no pagination metadata without take/skip/orderBy", () => {
    const normalized = normalizeSchema(friendsSchema, {
      include: { friends: true },
    });
    const result = normalizedSchema2construct(
      "http://example.com/person1",
      undefined,
      normalized,
      { filterOptions: { include: { friends: true } }, flavour: "lateral" },
    );
    expect(result.paginationMetadata.has("friends")).toBe(false);
    expect(whereString(result)).not.toContain("LATERAL");
  });

  test("lateral + x-inverseOf uses inverse edge inside LATERAL", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        parts: {
          type: "array",
          items: { $ref: "#/$defs/Place" },
          // @ts-expect-error Graviola extension
          "x-inverseOf": {
            inverseOf: ["#/$defs/Place/properties/partOf"],
          },
        },
        partOf: { $ref: "#/$defs/Place" },
      },
      $defs: {
        Place: {
          type: "object",
          properties: {
            name: { type: "string" },
            partOf: {
              type: "object",
              properties: { "@id": { type: "string" } },
            },
          },
        },
      },
    };
    // Bring Place to top-ish via normalize; use inline items for simplicity
    const inline: JSONSchema7 = {
      type: "object",
      properties: {
        parts: {
          type: "array",
          items: {
            type: "object",
            properties: { name: { type: "string" } },
          },
          // @ts-expect-error Graviola extension
          "x-inverseOf": {
            inverseOf: ["#/definitions/Place/properties/partOf"],
          },
        },
      },
    };
    const filterOptions = {
      include: { parts: { take: 5, orderBy: { name: "asc" as const } } },
    };
    const normalized = normalizeSchema(inline, filterOptions);
    const result = normalizedSchema2construct(
      "http://example.com/place1",
      undefined,
      normalized,
      { filterOptions, flavour: "lateral", resolveInverseMaxDepth: 1 },
    );
    const where = whereString(result);
    expect(where).toContain("LATERAL");
    // Inverse: ?parts … partOf ?subject (object first)
    expect(where).toMatch(/\?parts_\d+[^}]*partOf[^}]*\?subject/);
  });
});
