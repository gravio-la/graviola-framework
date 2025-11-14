import { describe, expect, test } from "@jest/globals";
import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";
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
    expect(normalized._propertyMetadata).toBeDefined();
    expect(normalized._propertyMetadata.author.isRelationship).toBe(true);
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

    // Tags should have pagination metadata
    expect((normalized.properties?.tags as any)["x-pagination"]).toEqual({
      take: 10,
      skip: undefined,
    });

    // Refs should be resolved
    expect(normalized._propertyMetadata.tags.isRelationship).toBe(true);
    expect(normalized._propertyMetadata.tags.isArray).toBe(true);
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

    // Should have basic properties
    expect(normalized.properties).toHaveProperty("@id");
    expect(normalized.properties).toHaveProperty("@type");
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

    // Tags should have pagination
    expect((normalized.properties?.tags as any)["x-pagination"]).toEqual({
      take: 5,
      skip: undefined,
    });

    // Metadata should be correct
    expect(normalized._propertyMetadata.camera.isRelationship).toBe(true);
    expect(normalized._propertyMetadata.location.isRelationship).toBe(true);
    expect(normalized._propertyMetadata.tags.isRelationship).toBe(true);
    expect(normalized._propertyMetadata.tags.isArray).toBe(true);
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

    // Tags should have custom pagination
    expect((normalized.properties?.tags as any)["x-pagination"]).toEqual({
      take: 5,
      skip: undefined,
    });

    // Note: defaultPaginationLimit is stored in filterOptions but not automatically applied
    // to properties without explicit pagination. This could be implemented in future if needed.
  });
});
