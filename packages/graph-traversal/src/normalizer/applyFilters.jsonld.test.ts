import { describe, test, expect } from "@jest/globals";
import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";
import { applyFilters } from "./applyFilters";
import type { PropertyMetadata } from "./types";

describe("applyFilters - JSON-LD Metadata Filtering", () => {
  const createMetadata = (
    isArray = false,
    isRelationship = false,
  ): PropertyMetadata => ({
    isArray,
    isRelationship,
  });

  test("excludes @id and @type by default", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
      },
    };

    const metadata = {
      "@id": createMetadata(),
      "@type": createMetadata(),
      name: createMetadata(),
      email: createMetadata(),
    };

    const filterOptions: GraphTraversalFilterOptions = {};

    const filtered = applyFilters(schema, metadata, filterOptions);

    // Should exclude @ properties
    expect(filtered.properties).not.toHaveProperty("@id");
    expect(filtered.properties).not.toHaveProperty("@type");

    // Should include regular properties
    expect(filtered.properties).toHaveProperty("name");
    expect(filtered.properties).toHaveProperty("email");
  });

  test("includes @ properties when excludeJsonLdMetadata is false", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        name: { type: "string" },
      },
    };

    const metadata = {
      "@id": createMetadata(),
      "@type": createMetadata(),
      name: createMetadata(),
    };

    const filterOptions: GraphTraversalFilterOptions = {
      excludeJsonLdMetadata: false, // Explicitly include @ properties
    };

    const filtered = applyFilters(schema, metadata, filterOptions);

    // Should include @ properties
    expect(filtered.properties).toHaveProperty("@id");
    expect(filtered.properties).toHaveProperty("@type");
    expect(filtered.properties).toHaveProperty("name");
  });

  test("excludes all JSON-LD keywords", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "@context": { type: "object" },
        "@graph": { type: "array" },
        "@value": { type: "string" },
        "@language": { type: "string" },
        name: { type: "string" },
      },
    };

    const metadata = Object.fromEntries(
      Object.keys(schema.properties!).map((k) => [k, createMetadata()]),
    );

    const filterOptions: GraphTraversalFilterOptions = {};

    const filtered = applyFilters(schema, metadata, filterOptions);

    // Should exclude all @ properties
    expect(filtered.properties).not.toHaveProperty("@id");
    expect(filtered.properties).not.toHaveProperty("@type");
    expect(filtered.properties).not.toHaveProperty("@context");
    expect(filtered.properties).not.toHaveProperty("@graph");
    expect(filtered.properties).not.toHaveProperty("@value");
    expect(filtered.properties).not.toHaveProperty("@language");

    // Should include name
    expect(filtered.properties).toHaveProperty("name");
  });

  test("@ property exclusion works with other filters", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
      },
    };

    const metadata = Object.fromEntries(
      Object.keys(schema.properties!).map((k) => [k, createMetadata()]),
    );

    const filterOptions: GraphTraversalFilterOptions = {
      select: {
        name: true,
        email: true,
      },
    };

    const filtered = applyFilters(schema, metadata, filterOptions);

    // Should exclude @ properties (default behavior)
    expect(filtered.properties).not.toHaveProperty("@id");
    expect(filtered.properties).not.toHaveProperty("@type");

    // Should only include selected properties
    expect(filtered.properties).toHaveProperty("name");
    expect(filtered.properties).toHaveProperty("email");
    expect(filtered.properties).not.toHaveProperty("password");
  });

  test("@ property exclusion works with omit", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
      },
    };

    const metadata = Object.fromEntries(
      Object.keys(schema.properties!).map((k) => [k, createMetadata()]),
    );

    const filterOptions: GraphTraversalFilterOptions = {
      omit: ["password"],
    };

    const filtered = applyFilters(schema, metadata, filterOptions);

    // Should exclude @ properties
    expect(filtered.properties).not.toHaveProperty("@id");

    // Should exclude omitted properties
    expect(filtered.properties).not.toHaveProperty("password");

    // Should include others
    expect(filtered.properties).toHaveProperty("name");
    expect(filtered.properties).toHaveProperty("email");
  });

  test("Schema.org properties are preserved", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "schema:givenName": { type: "string" },
        "schema:familyName": { type: "string" },
        "schema:email": { type: "string" },
      },
    };

    const metadata = Object.fromEntries(
      Object.keys(schema.properties!).map((k) => [k, createMetadata()]),
    );

    const filterOptions: GraphTraversalFilterOptions = {};

    const filtered = applyFilters(schema, metadata, filterOptions);

    // Should exclude @ properties
    expect(filtered.properties).not.toHaveProperty("@id");
    expect(filtered.properties).not.toHaveProperty("@type");

    // Should preserve Schema.org properties (they don't start with @)
    expect(filtered.properties).toHaveProperty("schema:givenName");
    expect(filtered.properties).toHaveProperty("schema:familyName");
    expect(filtered.properties).toHaveProperty("schema:email");
  });
});
