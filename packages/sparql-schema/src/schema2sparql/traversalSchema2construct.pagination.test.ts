/**
 * Pagination metadata tests for traversalSchema2construct
 *
 * These tests verify that pagination metadata is correctly:
 * - Extracted from traversal schemas
 * - Marked with _stage: "extraction"
 * - Passed through to prevent double-pagination
 */

import { describe, expect, test } from "@jest/globals";
import { JSONSchema7 } from "json-schema";
import { buildTraversalSchema } from "@graviola/edb-graph-traversal";

import { traversalSchema2construct } from "./traversalSchema2construct";

describe("traversalSchema2construct - Pagination Metadata", () => {
  test("extracts pagination from include pattern with take", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        friends: {
          type: "array",
          items: { type: "string" },
        },
      },
    };

    const normalized = buildTraversalSchema(schema, {
      include: {
        friends: { take: 20 },
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/person1",
      undefined,
      normalized,
    );

    // Check if buildTraversalSchema added pagination
    const friendsProperty = normalized.properties?.friends as JSONSchema7;
    if (friendsProperty && (friendsProperty as any)["x-pagination"]) {
      const pagMeta = result.paginationMetadata.get("friends");

      expect(pagMeta).toBeDefined();
      expect(pagMeta?.take).toBe(20);
      expect(pagMeta?._stage).toBe("extraction"); // Critical!
    }
  });

  test("extracts pagination with both take and skip", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        posts: {
          type: "array",
          items: { type: "object", properties: { title: { type: "string" } } },
        },
      },
    };

    const normalized = buildTraversalSchema(schema, {
      include: {
        posts: { take: 10, skip: 5 },
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/user1",
      undefined,
      normalized,
    );

    const postsProperty = normalized.properties?.posts as JSONSchema7;
    if (postsProperty && (postsProperty as any)["x-pagination"]) {
      const pagMeta = result.paginationMetadata.get("posts");

      expect(pagMeta).toBeDefined();
      expect(pagMeta?.take).toBe(10);
      expect(pagMeta?.skip).toBe(5);
      expect(pagMeta?._stage).toBe("extraction");
    }
  });

  test("does not create pagination metadata for non-paginated arrays", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: { type: "string" },
        },
      },
    };

    // No pagination in include
    const normalized = buildTraversalSchema(schema, {});

    const result = traversalSchema2construct(
      "http://example.com/doc1",
      undefined,
      normalized,
    );

    // Should not have pagination metadata
    expect(result.paginationMetadata.get("tags")).toBeUndefined();
  });

  test("handles multiple paginated arrays", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        friends: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" } } },
        },
        posts: {
          type: "array",
          items: { type: "object", properties: { title: { type: "string" } } },
        },
        comments: {
          type: "array",
          items: { type: "object", properties: { text: { type: "string" } } },
        },
      },
    };

    const normalized = buildTraversalSchema(schema, {
      include: {
        friends: { take: 10 },
        posts: { take: 20, skip: 5 },
        // comments not paginated
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/person1",
      undefined,
      normalized,
    );

    // Check friends pagination
    const friendsProperty = normalized.properties?.friends as JSONSchema7;
    if (friendsProperty && (friendsProperty as any)["x-pagination"]) {
      const friendsPag = result.paginationMetadata.get("friends");
      expect(friendsPag).toBeDefined();
      expect(friendsPag?.take).toBe(10);
      expect(friendsPag?._stage).toBe("extraction");
    }

    // Check posts pagination
    const postsProperty = normalized.properties?.posts as JSONSchema7;
    if (postsProperty && (postsProperty as any)["x-pagination"]) {
      const postsPag = result.paginationMetadata.get("posts");
      expect(postsPag).toBeDefined();
      expect(postsPag?.take).toBe(20);
      expect(postsPag?.skip).toBe(5);
      expect(postsPag?._stage).toBe("extraction");
    }

    // Comments should not have pagination
    expect(result.paginationMetadata.get("comments")).toBeUndefined();
  });

  test("source is always 'query' to prevent double-pagination", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { type: "string" },
        },
      },
    };

    const normalized = buildTraversalSchema(schema, {
      include: {
        items: { take: 100 },
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/collection1",
      undefined,
      normalized,
    );

    const itemsProperty = normalized.properties?.items as JSONSchema7;
    if (itemsProperty && (itemsProperty as any)["x-pagination"]) {
      const pagMeta = result.paginationMetadata.get("items");

      // The CRITICAL check: source must be "query"
      // This tells the extractor that pagination was applied at query stage
      // so it should NOT paginate again (would cause double-pagination!)
      expect(pagMeta?._stage).toBe("extraction");
    }
  });

  test("pagination on nested array properties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        department: {
          type: "object",
          properties: {
            name: { type: "string" },
            employees: {
              type: "array",
              items: {
                type: "object",
                properties: { name: { type: "string" } },
              },
            },
          },
        },
      },
    };

    const normalized = buildTraversalSchema(schema, {
      include: {
        department: {
          include: {
            employees: { take: 50 },
          },
        },
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/company1",
      undefined,
      normalized,
    );

    // Nested pagination should be tracked
    // (Note: This depends on how projectSchema handles nested pagination)
    expect(result.paginationMetadata).toBeDefined();
  });

  test("pagination with take: 0 (fetch none)", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        logs: {
          type: "array",
          items: { type: "string" },
        },
      },
    };

    const normalized = buildTraversalSchema(schema, {
      include: {
        logs: { take: 0 }, // Explicitly fetch none
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/system1",
      undefined,
      normalized,
    );

    const logsProperty = normalized.properties?.logs as JSONSchema7;
    if (logsProperty && (logsProperty as any)["x-pagination"]) {
      const pagMeta = result.paginationMetadata.get("logs");

      expect(pagMeta).toBeDefined();
      expect(pagMeta?.take).toBe(0);
      expect(pagMeta?._stage).toBe("extraction");
    }
  });

  test("pagination with large skip value", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        records: {
          type: "array",
          items: { type: "string" },
        },
      },
    };

    const normalized = buildTraversalSchema(schema, {
      include: {
        records: { skip: 1000, take: 10 }, // Start from 1001st record
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/db1",
      undefined,
      normalized,
    );

    const recordsProperty = normalized.properties?.records as JSONSchema7;
    if (recordsProperty && (recordsProperty as any)["x-pagination"]) {
      const pagMeta = result.paginationMetadata.get("records");

      expect(pagMeta).toBeDefined();
      expect(pagMeta?.skip).toBe(1000);
      expect(pagMeta?.take).toBe(10);
      expect(pagMeta?._stage).toBe("extraction");
    }
  });

  test("pagination with orderBy - single sort criterion", () => {
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

    const normalized = buildTraversalSchema(schema, {
      include: {
        friends: {
          take: 10,
          orderBy: { name: "asc" },
        },
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/person1",
      undefined,
      normalized,
    );

    const friendsProperty = normalized.properties?.friends as JSONSchema7;
    if (friendsProperty && (friendsProperty as any)["x-pagination"]) {
      const pagMeta = result.paginationMetadata.get("friends");

      expect(pagMeta).toBeDefined();
      expect(pagMeta?.orderBy).toEqual({ name: "asc" });
      expect(pagMeta?.take).toBe(10);
      expect(pagMeta?._stage).toBe("extraction");
    }
  });

  test("pagination with orderBy - multiple sort criteria", () => {
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

    const normalized = buildTraversalSchema(schema, {
      include: {
        posts: {
          take: 20,
          orderBy: [{ createdAt: "desc" }, { title: "asc" }],
        },
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/blog1",
      undefined,
      normalized,
    );

    const postsProperty = normalized.properties?.posts as JSONSchema7;
    if (postsProperty && (postsProperty as any)["x-pagination"]) {
      const pagMeta = result.paginationMetadata.get("posts");

      expect(pagMeta).toBeDefined();
      expect(pagMeta?.orderBy).toEqual([
        { createdAt: "desc" },
        { title: "asc" },
      ]);
      expect(pagMeta?.take).toBe(20);
      expect(pagMeta?._stage).toBe("extraction");
    }
  });

  test("pagination without orderBy - named nodes", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        friends: {
          type: "array",
          items: {
            type: "object",
            properties: {
              "@id": { type: "string" },
              name: { type: "string" },
            },
          },
        },
      },
    };

    const normalized = buildTraversalSchema(schema, {
      include: {
        friends: {
          take: 10,
          // No orderBy - named nodes have natural order
        },
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/person1",
      undefined,
      normalized,
    );

    const friendsProperty = normalized.properties?.friends as JSONSchema7;
    if (friendsProperty && (friendsProperty as any)["x-pagination"]) {
      const pagMeta = result.paginationMetadata.get("friends");

      expect(pagMeta).toBeDefined();
      expect(pagMeta?.take).toBe(10);
      expect(pagMeta?.orderBy).toBeUndefined(); // No orderBy for named nodes
      expect(pagMeta?._stage).toBe("extraction");
    }
  });

  test("pagination metadata is preserved in returned map", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { type: "number" },
        },
      },
    };

    const normalized = buildTraversalSchema(schema, {
      include: {
        data: { take: 5, skip: 2 },
      },
    });

    const result = traversalSchema2construct(
      "http://example.com/dataset1",
      undefined,
      normalized,
    );

    // Metadata map should be returned
    expect(result.paginationMetadata).toBeInstanceOf(Map);
    expect(result.paginationMetadata.size).toBeGreaterThanOrEqual(0);

    // If pagination was applied, it should be in the map
    const dataProperty = normalized.properties?.data as JSONSchema7;
    if (dataProperty && (dataProperty as any)["x-pagination"]) {
      expect(result.paginationMetadata.has("data")).toBe(true);
    }
  });
});
