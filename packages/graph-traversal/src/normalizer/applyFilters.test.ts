import { describe, expect, test } from "@jest/globals";
import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";
import {
  shouldIncludeProperty,
  applyFilters,
  extractPaginationOptions,
} from "./applyFilters";
import type { PropertyMetadata } from "./types";

describe("shouldIncludeProperty", () => {
  test("always includes @id property", () => {
    const metadata: PropertyMetadata = {
      isRelationship: false,
      isArray: false,
    };

    const result = shouldIncludeProperty("@id", metadata, {});

    expect(result.include).toBe(true);
  });

  test("always includes @type property", () => {
    const metadata: PropertyMetadata = {
      isRelationship: false,
      isArray: false,
    };

    const result = shouldIncludeProperty("@type", metadata, {});

    expect(result.include).toBe(true);
  });

  test("excludes property in omit list", () => {
    const metadata: PropertyMetadata = {
      isRelationship: false,
      isArray: false,
    };

    const filterOptions: GraphTraversalFilterOptions = {
      omit: ["name", "age"],
    };

    const result = shouldIncludeProperty("name", metadata, filterOptions);

    expect(result.include).toBe(false);
  });

  test("includes only selected properties when select is specified", () => {
    const metadata: PropertyMetadata = {
      isRelationship: false,
      isArray: false,
    };

    const filterOptions: GraphTraversalFilterOptions = {
      select: {
        name: true,
        email: true,
      },
    };

    expect(shouldIncludeProperty("name", metadata, filterOptions).include).toBe(
      true,
    );
    expect(shouldIncludeProperty("age", metadata, filterOptions).include).toBe(
      false,
    );
  });

  test("includes relationships by default when includeRelationsByDefault is true", () => {
    const metadata: PropertyMetadata = {
      isRelationship: true,
      isArray: false,
    };

    const filterOptions: GraphTraversalFilterOptions = {
      includeRelationsByDefault: true,
    };

    const result = shouldIncludeProperty("author", metadata, filterOptions);

    expect(result.include).toBe(true);
  });

  test("excludes relationships by default when includeRelationsByDefault is false", () => {
    const metadata: PropertyMetadata = {
      isRelationship: true,
      isArray: false,
    };

    const filterOptions: GraphTraversalFilterOptions = {
      includeRelationsByDefault: false,
    };

    const result = shouldIncludeProperty("author", metadata, filterOptions);

    expect(result.include).toBe(false);
  });

  test("includes relationship explicitly with include pattern (boolean)", () => {
    const metadata: PropertyMetadata = {
      isRelationship: true,
      isArray: false,
    };

    const filterOptions: GraphTraversalFilterOptions = {
      includeRelationsByDefault: false,
      include: {
        author: true,
      },
    };

    const result = shouldIncludeProperty("author", metadata, filterOptions);

    expect(result.include).toBe(true);
  });

  test("includes relationship with pagination options", () => {
    const metadata: PropertyMetadata = {
      isRelationship: true,
      isArray: true,
    };

    const filterOptions: GraphTraversalFilterOptions = {
      include: {
        tags: {
          take: 10,
          skip: 5,
        },
      },
    };

    const result = shouldIncludeProperty("tags", metadata, filterOptions);

    expect(result.include).toBe(true);
    expect(result.pagination).toEqual({
      take: 10,
      skip: 5,
    });
  });

  test("includes non-relationships by default", () => {
    const metadata: PropertyMetadata = {
      isRelationship: false,
      isArray: false,
    };

    const result = shouldIncludeProperty("name", metadata, {});

    expect(result.include).toBe(true);
  });
});

describe("applyFilters", () => {
  test("keeps all properties when no filters specified", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
      },
    };

    const propertyMetadata = {
      name: { isRelationship: false, isArray: false },
      age: { isRelationship: false, isArray: false },
      email: { isRelationship: false, isArray: false },
    };

    const filtered = applyFilters(schema, propertyMetadata, {});

    expect(filtered.properties).toHaveProperty("name");
    expect(filtered.properties).toHaveProperty("age");
    expect(filtered.properties).toHaveProperty("email");
  });

  test("removes omitted properties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
      },
    };

    const propertyMetadata = {
      name: { isRelationship: false, isArray: false },
      age: { isRelationship: false, isArray: false },
      email: { isRelationship: false, isArray: false },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      omit: ["age"],
    };

    const filtered = applyFilters(schema, propertyMetadata, filterOptions);

    expect(filtered.properties).toHaveProperty("name");
    expect(filtered.properties).not.toHaveProperty("age");
    expect(filtered.properties).toHaveProperty("email");
  });

  test("keeps only selected properties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
      },
    };

    const propertyMetadata = {
      name: { isRelationship: false, isArray: false },
      age: { isRelationship: false, isArray: false },
      email: { isRelationship: false, isArray: false },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      select: {
        name: true,
        email: true,
      },
    };

    const filtered = applyFilters(schema, propertyMetadata, filterOptions);

    expect(filtered.properties).toHaveProperty("name");
    expect(filtered.properties).not.toHaveProperty("age");
    expect(filtered.properties).toHaveProperty("email");
  });

  test("adds pagination metadata to array relationships", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            type: "object",
            properties: {
              "@id": { type: "string" },
              label: { type: "string" },
            },
          },
        },
      },
    };

    const propertyMetadata = {
      tags: {
        isRelationship: true,
        isArray: true,
        itemType: "object" as const,
      },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      include: {
        tags: {
          take: 10,
          skip: 0,
        },
      },
    };

    const filtered = applyFilters(schema, propertyMetadata, filterOptions);

    expect(filtered.properties?.tags).toBeDefined();
    expect((filtered.properties?.tags as any)["x-pagination"]).toEqual({
      take: 10,
      skip: 0,
    });
  });

  test("excludes relationships when includeRelationsByDefault is false", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        author: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
      },
    };

    const propertyMetadata = {
      name: { isRelationship: false, isArray: false },
      author: { isRelationship: true, isArray: false },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      includeRelationsByDefault: false,
    };

    const filtered = applyFilters(schema, propertyMetadata, filterOptions);

    expect(filtered.properties).toHaveProperty("name");
    expect(filtered.properties).not.toHaveProperty("author");
  });

  test("includes explicitly specified relationships even when includeRelationsByDefault is false", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        author: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
        publisher: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
      },
    };

    const propertyMetadata = {
      name: { isRelationship: false, isArray: false },
      author: { isRelationship: true, isArray: false },
      publisher: { isRelationship: true, isArray: false },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      includeRelationsByDefault: false,
      include: {
        author: true,
      },
    };

    const filtered = applyFilters(schema, propertyMetadata, filterOptions);

    expect(filtered.properties).toHaveProperty("name");
    expect(filtered.properties).toHaveProperty("author");
    expect(filtered.properties).not.toHaveProperty("publisher");
  });

  test("updates required array when properties are filtered", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
      },
      required: ["name", "age", "email"],
    };

    const propertyMetadata = {
      name: { isRelationship: false, isArray: false },
      age: { isRelationship: false, isArray: false },
      email: { isRelationship: false, isArray: false },
    };

    const filterOptions: GraphTraversalFilterOptions = {
      omit: ["age"],
    };

    const filtered = applyFilters(schema, propertyMetadata, filterOptions);

    expect(filtered.required).toEqual(["name", "email"]);
  });

  test("handles schema without properties", () => {
    const schema: JSONSchema7 = {
      type: "string",
    };

    const filtered = applyFilters(schema, {}, {});

    expect(filtered).toEqual(schema);
  });

  test("includes properties without metadata by default", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        unknownProp: { type: "string" },
      },
    };

    const propertyMetadata = {
      name: { isRelationship: false, isArray: false },
      // unknownProp has no metadata
    };

    const filtered = applyFilters(schema, propertyMetadata, {});

    expect(filtered.properties).toHaveProperty("name");
    expect(filtered.properties).toHaveProperty("unknownProp");
  });
});

describe("extractPaginationOptions", () => {
  test("returns undefined when include is not specified", () => {
    const result = extractPaginationOptions("tags", undefined);

    expect(result).toBeUndefined();
  });

  test("returns undefined when property is not in include", () => {
    const result = extractPaginationOptions("tags", {
      author: true,
    });

    expect(result).toBeUndefined();
  });

  test("returns undefined when property is included as boolean", () => {
    const result = extractPaginationOptions("tags", {
      tags: true,
    });

    expect(result).toBeUndefined();
  });

  test("returns pagination options when specified", () => {
    const result = extractPaginationOptions("tags", {
      tags: {
        take: 20,
        skip: 10,
      },
    });

    expect(result).toEqual({
      take: 20,
      skip: 10,
    });
  });

  test("returns partial pagination options", () => {
    const result = extractPaginationOptions("tags", {
      tags: {
        take: 15,
      },
    });

    expect(result).toEqual({
      take: 15,
      skip: undefined,
    });
  });
});
