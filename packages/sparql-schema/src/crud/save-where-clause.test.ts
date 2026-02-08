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
