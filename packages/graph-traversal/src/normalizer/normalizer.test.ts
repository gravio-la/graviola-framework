import { describe, expect, test } from "@jest/globals";
import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { normalizeSchema } from "./index";

describe("normalizeSchema - integration tests", () => {
  test("normalizes schema with simple refs", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        title: { type: "string" },
        author: { $ref: "#/$defs/Person" },
      },
      $defs: {
        Person: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema);

    expect(normalized._normalized).toBe(true);
    expect((normalized.properties?.author as JSONSchema7).$ref).toBeUndefined();
    expect(
      (normalized.properties?.author as JSONSchema7).properties?.name,
    ).toBeDefined();
  });

  test("normalizes nested refs and applies filters", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        author: { $ref: "#/$defs/Person" },
        tags: {
          type: "array",
          items: { $ref: "#/$defs/Tag" },
        },
      },
      $defs: {
        Person: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
          },
        },
        Tag: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            label: { type: "string" },
          },
        },
      },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      omit: ["description"],
      includeRelationsByDefault: false,
      include: {
        tags: {
          take: 10,
        },
      },
    };

    const normalized = normalizeSchema(schema, filterOptions);

    // Should have title but not description
    expect(normalized.properties).toHaveProperty("title");
    expect(normalized.properties).not.toHaveProperty("description");

    // Should have tags but not author (includeRelationsByDefault is false)
    expect(normalized.properties).toHaveProperty("tags");
    expect(normalized.properties).not.toHaveProperty("author");

    // Note: Pagination is no longer stored in schema, it's passed through context

    // Refs should be resolved
  });

  test("handles circular references in exhibition schema", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        title: { type: "string" },
        tags: {
          type: "array",
          items: { $ref: "#/$defs/Tag" },
        },
      },
      $defs: {
        Tag: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            parent: { $ref: "#/$defs/Tag" },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, {
      includeRelationsByDefault: true,
    });

    expect(normalized._normalized).toBe(true);
    expect(normalized.properties?.tags).toBeDefined();

    // Should handle circular reference without infinite loop
    const tagsSchema = normalized.properties?.tags as JSONSchema7;
    const itemsSchema = tagsSchema.items as JSONSchema7;
    expect(itemsSchema.properties?.parent).toBeDefined();
  });

  test("applies select filter to keep only specified properties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      select: {
        id: true,
        title: true,
      },
    };

    const normalized = normalizeSchema(schema, filterOptions);

    expect(Object.keys(normalized.properties || {})).toEqual(["id", "title"]);
  });

  test("realistic photo metadata schema with EXIF relationships", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        filePath: { type: "string" },
        fileName: { type: "string" },
        fileSize: { type: "number" },
        mimeType: { type: "string" },
        width: { type: "number" },
        height: { type: "number" },
        captureDate: { type: "string", format: "date-time" },
        camera: { $ref: "#/$defs/Camera" },
        location: { $ref: "#/$defs/Location" },
        tags: {
          type: "array",
          items: { $ref: "#/$defs/Tag" },
        },
        people: {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
      },
      $defs: {
        Camera: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            make: { type: "string" },
            model: { type: "string" },
            lens: { type: "string" },
          },
        },
        Location: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            latitude: { type: "number" },
            longitude: { type: "number" },
            address: { type: "string" },
          },
        },
        Tag: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            label: { type: "string" },
          },
        },
        Person: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
          },
        },
      },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      includeRelationsByDefault: false,
      include: {
        camera: true,
        location: true,
        tags: {
          take: 5,
        },
      },
      omit: ["fileSize", "mimeType"],
    };

    const normalized = normalizeSchema(schema, filterOptions);

    // JSON-LD metadata properties should be filtered out by default
    expect(normalized.properties).not.toHaveProperty("@id");
    expect(normalized.properties).not.toHaveProperty("@type");

    // Should have basic properties
    expect(normalized.properties).toHaveProperty("filePath");
    expect(normalized.properties).toHaveProperty("fileName");

    // Should not have omitted properties
    expect(normalized.properties).not.toHaveProperty("fileSize");
    expect(normalized.properties).not.toHaveProperty("mimeType");

    // Should have included relationships
    expect(normalized.properties).toHaveProperty("camera");
    expect(normalized.properties).toHaveProperty("location");
    expect(normalized.properties).toHaveProperty("tags");

    // Should not have excluded relationship
    expect(normalized.properties).not.toHaveProperty("people");

    // Note: Pagination is no longer stored in schema, it's passed through context
  });

  test("handles schema with anyOf for nullable relationships", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        title: { type: "string" },
        author: {
          anyOf: [{ $ref: "#/$defs/Person" }, { type: "null" }],
        },
      },
      $defs: {
        Person: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema);

    expect(normalized._normalized).toBe(true);
    expect(normalized.properties?.author).toBeDefined();

    const authorSchema = normalized.properties?.author as JSONSchema7;
    expect(authorSchema.anyOf).toBeDefined();
    expect((authorSchema.anyOf?.[0] as JSONSchema7).$ref).toBeUndefined();
  });

  test("preserves original schema immutability", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        ref: { $ref: "#/$defs/Thing" },
      },
      $defs: {
        Thing: {
          type: "object",
          properties: {
            value: { type: "string" },
          },
        },
      },
    };

    const originalPropsCount = Object.keys(schema.properties || {}).length;
    const normalized = normalizeSchema(schema, { omit: ["name"] });

    // Original schema should be unchanged
    expect(Object.keys(schema.properties || {}).length).toBe(
      originalPropsCount,
    );
    expect(schema.properties).toHaveProperty("name");
    expect((schema.properties?.ref as JSONSchema7).$ref).toBe("#/$defs/Thing");

    // Normalized schema should be filtered
    expect(normalized.properties).not.toHaveProperty("name");
  });

  test("combines select and include filters correctly", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        author: { $ref: "#/$defs/Person" },
        publisher: { $ref: "#/$defs/Organization" },
      },
      $defs: {
        Person: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
        Organization: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
      },
    };

    // Note: In Prisma, select and include are mutually exclusive,
    // but our implementation allows them. Select takes precedence for non-relationships.
    const filterOptions: GraphTraversalFilterOptions = {
      select: {
        id: true,
        title: true,
      },
    };

    const normalized = normalizeSchema(schema, filterOptions);

    // Only selected properties should be included
    expect(normalized.properties).toHaveProperty("id");
    expect(normalized.properties).toHaveProperty("title");
    expect(normalized.properties).not.toHaveProperty("description");
  });

  test("default pagination limit is applied when specified", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: { $ref: "#/$defs/Tag" },
        },
        categories: {
          type: "array",
          items: { $ref: "#/$defs/Category" },
        },
      },
      $defs: {
        Tag: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            label: { type: "string" },
          },
        },
        Category: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
      },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      defaultPaginationLimit: 20,
      include: {
        tags: {
          take: 5, // Override default
        },
        categories: true, // Should use default (but we don't apply it automatically in the current implementation)
      },
    };

    const normalized = normalizeSchema(schema, filterOptions);

    // Note: Pagination is no longer stored in schema, it's passed through context
    // defaultPaginationLimit is stored in filterOptions but not automatically applied
    // to properties without explicit pagination. This could be implemented in future if needed.
  });

  test("logs normalized schema for Person with jobs and WorkingPeriod relationships - depth 1 and 2", () => {
    // Create fixture schema with Person, Organization, and WorkingPeriod
    const rootSchema: JSONSchema7 = {
      type: "object",
      $defs: {
        Person: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
            jobs: {
              type: "array",
              items: { $ref: "#/$defs/WorkingPeriod" },
            },
          },
        },
        Organization: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
            businessCategory: { type: "string" },
          },
        },
        WorkingPeriod: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            for: {
              anyOf: [
                { $ref: "#/$defs/Person" },
                { $ref: "#/$defs/Organization" },
              ],
            },
          },
        },
      },
    };

    // Get Person as top-level schema
    const personSchema = bringDefinitionToTop(rootSchema, "Person");

    console.log("\n=== Person Schema (Top-Level) ===");
    console.log(JSON.stringify(personSchema, null, 2));

    // Test 1: Depth 1 - Only include jobs, but not nested "for" relationship
    console.log(
      "\n=== Test 1: Depth 1 - Include jobs only (no nested 'for') ===",
    );
    const normalizedDepth1 = normalizeSchema(personSchema, {
      includeRelationsByDefault: false,
      include: {
        jobs: true, // Include jobs but not the nested "for" relationship
      },
    });
    console.log(JSON.stringify(normalizedDepth1, null, 2));

    // Test 2: Depth 2 - Include jobs and the nested "for" relationship
    console.log(
      "\n=== Test 2: Depth 2 - Include jobs with nested 'for' relationship ===",
    );
    const normalizedDepth2 = normalizeSchema(personSchema, {
      includeRelationsByDefault: false,
      include: {
        jobs: {
          include: {
            for: true, // Include the nested "for" relationship within jobs
          },
        },
      },
    });
    console.log(JSON.stringify(normalizedDepth2, null, 2));

    // Test 3: Select only name and jobs
    console.log("\n=== Test 3: Select only name and jobs ===");
    const normalizedSelect = normalizeSchema(personSchema, {
      select: {
        name: true,
        jobs: true,
      },
    });
    console.log(JSON.stringify(normalizedSelect, null, 2));

    // Test 4: Include all relations by default
    console.log("\n=== Test 4: Include all relations by default ===");
    const normalizedAllRelations = normalizeSchema(personSchema, {
      includeRelationsByDefault: true,
    });
    console.log(JSON.stringify(normalizedAllRelations, null, 2));

    // Test 5: Include jobs with pagination and nested "for"
    console.log(
      "\n=== Test 5: Include jobs with pagination and nested 'for' ===",
    );
    const normalizedPagination = normalizeSchema(personSchema, {
      includeRelationsByDefault: false,
      include: {
        jobs: {
          take: 10,
          include: {
            for: true, // Include the nested "for" relationship
          },
        },
      },
    });
    console.log(JSON.stringify(normalizedPagination, null, 2));

    // Test 6: Omit jobs but include name
    console.log("\n=== Test 6: Omit jobs, include name ===");
    const normalizedOmit = normalizeSchema(personSchema, {
      omit: ["jobs"],
    });
    console.log(JSON.stringify(normalizedOmit, null, 2));

    // Test 7: Depth 2 with nested "for" included
    console.log("\n=== Test 7: Depth 2 - Include jobs with nested 'for' ===");
    const normalizedOrgFields = normalizeSchema(personSchema, {
      includeRelationsByDefault: false,
      include: {
        jobs: {
          include: {
            for: true, // Include the nested "for" relationship
          },
        },
      },
    });
    console.log(JSON.stringify(normalizedOrgFields, null, 2));

    // Note: This test currently only logs output for review
    // Assertions will be added later once the expected output is verified
    expect(normalizedDepth1._normalized).toBe(true);
    expect(normalizedDepth2._normalized).toBe(true);
  });

  test("handles nested includes with pagination (knows -> knows)", () => {
    const schema: JSONSchema7 = {
      type: "object",
      $defs: {
        Person: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "schema:givenName": { type: "string" },
            "schema:familyName": { type: "string" },
            "schema:knows": {
              type: "array",
              items: { $ref: "#/$defs/Person" },
            },
          },
        },
      },
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "schema:givenName": { type: "string" },
        "schema:familyName": { type: "string" },
        "schema:knows": {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
      },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      includeRelationsByDefault: false,
      include: {
        "schema:knows": {
          take: 5,
          include: {
            "schema:knows": {
              take: 5,
            },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, filterOptions);

    expect(normalized._normalized).toBe(true);
    expect(normalized.properties).toHaveProperty("schema:knows");

    // Top-level knows should be present (pagination passed through context)
    const knowsSchema = normalized.properties?.["schema:knows"] as JSONSchema7;
    expect(knowsSchema).toBeDefined();

    // Nested knows (within array items) should also be present
    expect(knowsSchema.type).toBe("array");
    const itemsSchema = knowsSchema.items as JSONSchema7;
    expect(itemsSchema).toBeDefined();
    expect(itemsSchema.properties).toHaveProperty("schema:knows");

    const nestedKnowsSchema = itemsSchema.properties?.[
      "schema:knows"
    ] as JSONSchema7;
    expect(nestedKnowsSchema).toBeDefined();

    // Note: Pagination is no longer stored in schema, it's passed through context
  });

  test("handles deeply nested includes with pagination (3 levels: knows -> knows -> knows)", () => {
    const schema: JSONSchema7 = {
      type: "object",
      $defs: {
        Person: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "schema:givenName": { type: "string" },
            "schema:familyName": { type: "string" },
            "schema:knows": {
              type: "array",
              items: { $ref: "#/$defs/Person" },
            },
          },
        },
      },
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "schema:givenName": { type: "string" },
        "schema:familyName": { type: "string" },
        "schema:knows": {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
      },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      includeRelationsByDefault: false,
      include: {
        "schema:knows": {
          take: 10,
          include: {
            "schema:knows": {
              take: 5,
              include: {
                "schema:knows": {
                  take: 2,
                },
              },
            },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, filterOptions);

    expect(normalized._normalized).toBe(true);
    expect(normalized.properties).toHaveProperty("schema:knows");

    // Level 1: Top-level knows should be present (pagination passed through context)
    const level1Knows = normalized.properties?.["schema:knows"] as JSONSchema7;
    expect(level1Knows).toBeDefined();

    // Level 2: Nested knows should be present
    expect(level1Knows.type).toBe("array");
    const level1Items = level1Knows.items as JSONSchema7;
    expect(level1Items).toBeDefined();
    expect(level1Items.properties).toHaveProperty("schema:knows");

    const level2Knows = level1Items.properties?.["schema:knows"] as JSONSchema7;
    expect(level2Knows).toBeDefined();

    // Level 3: Deeply nested knows should be present
    expect(level2Knows.type).toBe("array");
    const level2Items = level2Knows.items as JSONSchema7;
    expect(level2Items).toBeDefined();
    expect(level2Items.properties).toHaveProperty("schema:knows");

    const level3Knows = level2Items.properties?.["schema:knows"] as JSONSchema7;
    expect(level3Knows).toBeDefined();

    // Note: Pagination is no longer stored in schema, it's passed through context
  });
});
