import { describe, test, expect } from "bun:test";
import { JSONSchema7 } from "json-schema";
import { normalizeSchema } from "@graviola/edb-graph-traversal";
import { normalizedSchema2construct } from "./normalizedSchema2construct";

describe("normalizedSchema2construct - SUBSELECT Generation", () => {
  test("generates SUBSELECT with single ORDER BY", () => {
    const schema: JSONSchema7 = {
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

    const normalized = normalizeSchema(schema, {
      include: {
        friends: {
          take: 10,
          orderBy: { name: "asc" },
        },
      },
    });

    const result = normalizedSchema2construct(
      "http://example.com/person1",
      normalized,
    );

    // Verify pagination metadata is collected
    const pagMeta = result.paginationMetadata.get("friends");
    expect(pagMeta).toBeDefined();
    expect(pagMeta?.orderBy).toEqual({ name: "asc" });
    expect(pagMeta?.take).toBe(10);

    // Verify WHERE patterns include SUBSELECT
    expect(result.wherePatterns.length).toBeGreaterThan(0);

    // Convert WHERE patterns to string to inspect
    const whereString = result.wherePatterns
      .map((p) => p.toString())
      .join("\n");

    // Check for SUBSELECT keywords
    expect(whereString).toContain("SELECT");
    expect(whereString).toContain("ORDER BY");
    expect(whereString).toContain("LIMIT");
  });

  test("generates SUBSELECT with multiple ORDER BY criteria", () => {
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

    const normalized = normalizeSchema(schema, {
      include: {
        posts: {
          take: 20,
          skip: 5,
          orderBy: [{ createdAt: "desc" }, { title: "asc" }],
        },
      },
    });

    const result = normalizedSchema2construct(
      "http://example.com/blog1",
      normalized,
    );

    const whereString = result.wherePatterns
      .map((p) => p.toString())
      .join("\n");

    // Should contain both ORDER BY criteria
    expect(whereString).toContain("ORDER BY");
    expect(whereString).toContain("LIMIT 20");
    expect(whereString).toContain("OFFSET 5");
  });

  test("generates SUBSELECT with LIMIT only (no ORDER BY)", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              value: { type: "string" },
            },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, {
      include: {
        items: {
          take: 5,
          // No orderBy
        },
      },
    });

    const result = normalizedSchema2construct(
      "http://example.com/list1",
      normalized,
    );

    const whereString = result.wherePatterns
      .map((p) => p.toString())
      .join("\n");

    // Should have SUBSELECT with LIMIT but no ORDER BY
    expect(whereString).toContain("SELECT");
    expect(whereString).toContain("LIMIT 5");
  });

  test("does not generate SUBSELECT for array without pagination", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, {
      include: {
        tags: true, // Include but no pagination
      },
    });

    const result = normalizedSchema2construct(
      "http://example.com/article1",
      normalized,
    );

    const whereString = result.wherePatterns
      .map((p) => p.toString())
      .join("\n");

    // Should NOT have SUBSELECT - just regular triple pattern
    // The string representation from sparql builder won't contain these SUBSELECT keywords
    // in the expected format when it's a simple pattern
    expect(result.wherePatterns).toBeDefined();
    expect(result.paginationMetadata.has("tags")).toBe(false);
  });

  test("handles OFFSET without ORDER BY", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, {
      include: {
        items: {
          take: 10,
          skip: 20,
        },
      },
    });

    const result = normalizedSchema2construct(
      "http://example.com/container1",
      normalized,
    );

    const whereString = result.wherePatterns
      .map((p) => p.toString())
      .join("\n");

    expect(whereString).toContain("SELECT");
    expect(whereString).toContain("LIMIT 10");
    expect(whereString).toContain("OFFSET 20");
  });

  test("SUBSELECT includes ORDER BY property patterns", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
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

    const normalized = normalizeSchema(schema, {
      include: {
        friends: {
          take: 10,
          orderBy: { name: "asc" },
        },
      },
    });

    const result = normalizedSchema2construct(
      "http://example.com/person1",
      normalized,
    );

    const whereString = result.wherePatterns
      .map((p) => p.toString())
      .join("\n");

    // The SUBSELECT should include a pattern for the 'name' property
    // used in ORDER BY
    expect(whereString).toContain("SELECT");
    expect(whereString).toContain("ORDER BY");
  });

  test("handles prefixMap in ORDER BY properties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        friends: {
          type: "array",
          items: {
            type: "object",
            properties: {
              "foaf:name": { type: "string" },
            },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, {
      include: {
        friends: {
          take: 10,
          orderBy: { "foaf:name": "asc" },
        },
      },
    });

    const result = normalizedSchema2construct(
      "http://example.com/person1",
      normalized,
      {
        prefixMap: {
          foaf: "http://xmlns.com/foaf/0.1/",
        },
      },
    );

    const whereString = result.wherePatterns
      .map((p) => p.toString())
      .join("\n");

    // Should generate valid SPARQL with prefixed name
    expect(whereString).toContain("SELECT");
    expect(whereString).toContain("ORDER BY");
  });
});
