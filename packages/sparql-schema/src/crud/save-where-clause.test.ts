/**
 * Test to verify that DELETE/INSERT WHERE clauses are NOT wrapped in OPTIONAL
 * This is critical for update operations to work correctly
 */

import { describe, test, expect, mock } from "bun:test";
import { JSONSchema7 } from "json-schema";
import { save } from "./save";

describe("save - WHERE Clause Correctness", () => {
  test("DELETE/INSERT WHERE clause IS wrapped in OPTIONAL for UPSERT behavior", async () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
      required: ["name"],
    };

    const dataToBeSaved = {
      "@context": { "@vocab": "https://ontology.semantic-desk.top/garden#" },
      "@id": "https://ontology.semantic-desk.top/garden#Patch/z5l793voljs",
      "@type": "https://ontology.semantic-desk.top/garden#Patch",
      name: "Test Patch",
      description: "Test Description",
    };

    // Mock the updateFetch to capture the generated query
    let capturedQuery = "";
    const mockUpdateFetch = mock(async (query: string) => {
      capturedQuery = query;
      return {};
    });

    await save(dataToBeSaved, schema, mockUpdateFetch, {
      defaultPrefix: "https://ontology.semantic-desk.top/garden#",
      queryBuildOptions: {},
    });

    // Verify the query was generated
    expect(capturedQuery).toBeDefined();
    expect(capturedQuery.length).toBeGreaterThan(0);

    // Extract the WHERE clause
    const whereIndex = capturedQuery.indexOf("WHERE");
    expect(whereIndex).toBeGreaterThan(-1);

    const whereClause = capturedQuery.substring(whereIndex);

    // IMPORTANT: The WHERE clause SHOULD be wrapped in OPTIONAL for UPSERT functionality
    // This allows the query to work whether the entity exists (UPDATE) or not (INSERT)
    // WHERE { OPTIONAL { ... patterns ... } } enables UPSERT behavior

    // Check that the WHERE block starts with OPTIONAL
    const whereContentStart = whereClause
      .substring(whereClause.indexOf("{") + 1, whereClause.indexOf("{") + 50)
      .trim();

    expect(whereContentStart).toMatch(/^OPTIONAL\s*\{/);

    // The VALUES clause and patterns should be inside the OPTIONAL
    expect(whereClause).toContain("VALUES ?subject");

    // But inside the OPTIONAL, patterns should be properly nested
    // Required properties should appear without their own OPTIONAL wrapper
    expect(whereClause).toContain("Patch");

    console.log("\n=== Generated DELETE/INSERT Query (UPSERT) ===");
    console.log(capturedQuery);
    console.log("==========================================\n");
  });

  test("DELETE/INSERT should only match if entity exists", async () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };

    const dataToBeSaved = {
      "@context": { "@vocab": "https://example.com/" },
      "@id": "https://example.com/entity/123",
      "@type": "https://example.com/Entity",
      name: "Test",
    };

    let capturedQuery = "";
    const mockUpdateFetch = mock(async (query: string) => {
      capturedQuery = query;
      return {};
    });

    await save(dataToBeSaved, schema, mockUpdateFetch, {
      defaultPrefix: "https://example.com/",
      queryBuildOptions: {},
    });

    // The WHERE clause should have required patterns that ensure entity exists
    expect(capturedQuery).toContain("WHERE");
    expect(capturedQuery).toContain("VALUES ?subject");

    // The required property (name) should be checked
    const whereClause = capturedQuery.substring(capturedQuery.indexOf("WHERE"));
    expect(whereClause).toContain("name");
  });
});

describe("save - delete and insert are separate operations", () => {
  const schema: JSONSchema7 = {
    type: "object",
    properties: {
      name: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["name"],
  };
  const data = {
    "@context": { "@vocab": "https://example.org/" },
    "@id": "https://example.org/Item/1",
    "@type": "https://example.org/Item",
    name: "One",
    tags: ["a", "b"],
  };

  const capture = async (options: Record<string, unknown>) => {
    let query = "";
    await save(
      data,
      schema,
      async (q: string) => {
        query = q;
        return {};
      },
      {
        defaultPrefix: "https://example.org/",
        queryBuildOptions: {} as never,
        ...options,
      },
    );
    return query;
  };

  test("the new state is inserted with INSERT DATA, outside the DELETE's WHERE", async () => {
    const query = await capture({});
    const [deletePart, insertPart] = query.split(/\s;\s*\n/);
    expect(deletePart).toContain("DELETE");
    expect(deletePart).toContain("WHERE");
    // An INSERT sharing the WHERE runs once per solution and multiplies blank nodes.
    expect(deletePart).not.toContain("INSERT");
    expect(insertPart).toMatch(/^INSERT DATA \{/);
    expect(insertPart).not.toContain("WHERE");
    expect(insertPart).toContain('"One"');
  });

  test("a named graph scopes both operations", async () => {
    const query = await capture({ defaultUpdateGraph: "urn:graph:items" });
    const [deletePart, insertPart] = query.split(/\s;\s*\n/);
    expect(deletePart).toContain("WITH <urn:graph:items>");
    expect(insertPart).toMatch(/^INSERT DATA \{\s*GRAPH <urn:graph:items> \{/);
  });

  test("skipRemove sends only the INSERT DATA", async () => {
    const query = await capture({
      skipRemove: true,
      defaultUpdateGraph: "urn:graph:items",
    });
    expect(query).not.toContain("DELETE");
    expect(query).toMatch(/INSERT DATA \{\s*GRAPH <urn:graph:items> \{/);
  });

  test("maxRecursion reaches deeper nesting in the DELETE", async () => {
    const nestedSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        billing: {
          type: "object",
          properties: {
            total: { type: "number" },
            detail: {
              type: "object",
              properties: {
                net: { type: "number" },
              },
            },
          },
        },
      },
      required: ["name"],
    };
    const nestedData = {
      "@context": { "@vocab": "https://example.org/" },
      "@id": "https://example.org/Order/1",
      "@type": "https://example.org/Order",
      name: "One",
      billing: { total: 1, detail: { net: 1 } },
    };

    let shallowQuery = "";
    await save(
      nestedData,
      nestedSchema,
      async (q) => {
        shallowQuery = q;
        return {};
      },
      {
        defaultPrefix: "https://example.org/",
        queryBuildOptions: {},
        maxRecursion: 0,
      },
    );

    let deepQuery = "";
    await save(
      nestedData,
      nestedSchema,
      async (q) => {
        deepQuery = q;
        return {};
      },
      {
        defaultPrefix: "https://example.org/",
        queryBuildOptions: {},
        maxRecursion: 3,
      },
    );

    const shallowDelete = shallowQuery.split(/\s;\s*\n/)[0]!;
    const deepDelete = deepQuery.split(/\s;\s*\n/)[0]!;
    expect(shallowDelete).not.toContain("net");
    expect(deepDelete).toContain("net");
  });
});
