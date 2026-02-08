/**
 * Test for the specific user case: filtering Patches by geoFeature
 */

import { describe, test, expect } from "bun:test";
import { JSONSchema7 } from "json-schema";
import { normalizeSchema } from "@graviola/edb-graph-traversal";
import { normalizedSchema2construct } from "./normalizedSchema2construct";
import { buildSPARQLConstructQuery } from "./buildSPARQLConstructQuery";

describe("User Case: Filter Patch by geoFeature", () => {
  test("filters Patch entities by specific geoFeature @id", () => {
    // Simplified Patch schema
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        geoFeature: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
        description: { type: "string" },
        patchType: { type: "string" },
      },
      required: ["name"],
    };

    const filterOptions = {
      where: {
        geoFeature: {
          "@id":
            "https://ontology.semantic-desk.top/garden#GeoFeature/25jy3nxgouo",
        },
      },
    };

    const normalized = normalizeSchema(schema, filterOptions);
    const result = normalizedSchema2construct(
      undefined, // Query all Patches
      "https://ontology.semantic-desk.top/garden#Patch", // Only Patch type
      normalized,
      {
        filterOptions,
        prefixMap: {
          "": "https://ontology.semantic-desk.top/garden#",
        },
      },
    );

    // Build complete query
    const query = buildSPARQLConstructQuery(result, {
      "": "https://ontology.semantic-desk.top/garden#",
    });

    console.log("\n=== Generated SPARQL Query ===");
    console.log(query);
    console.log("================================\n");

    // Verify the query contains the filter
    expect(query).toContain("geoFeature");
    expect(query).toContain("25jy3nxgouo");

    // The filter should be present in the WHERE clause
    const whereIndex = query.indexOf("WHERE");
    const filterPart = query.substring(whereIndex);
    expect(filterPart).toContain("geoFeature");
    expect(filterPart).toContain("25jy3nxgouo");
  });

  test("generated query should filter results correctly", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        geoFeature: {
          type: "object",
          properties: {
            "@id": { type: "string" },
          },
        },
      },
      required: ["name"],
    };

    const filterOptions = {
      where: {
        geoFeature: {
          "@id":
            "https://ontology.semantic-desk.top/garden#GeoFeature/25jy3nxgouo",
        },
      },
    };

    const normalized = normalizeSchema(schema, filterOptions);
    const result = normalizedSchema2construct(
      undefined,
      "https://ontology.semantic-desk.top/garden#Patch",
      normalized,
      {
        filterOptions,
        prefixMap: {
          "": "https://ontology.semantic-desk.top/garden#",
        },
      },
    );

    const query = buildSPARQLConstructQuery(result, {
      "": "https://ontology.semantic-desk.top/garden#",
    });

    // The query should have:
    // 1. A CONSTRUCT pattern for geoFeature
    expect(query).toContain("CONSTRUCT");
    expect(query.substring(0, query.indexOf("WHERE"))).toContain(":geoFeature");

    // 2. A WHERE pattern that binds geoFeature to the specific IRI
    const wherePart = query.substring(query.indexOf("WHERE"));
    expect(wherePart).toContain(":geoFeature");
    expect(wherePart).toContain("25jy3nxgouo");

    // 3. The filter should use the same variable in both CONSTRUCT and WHERE
    // This ensures the filter is actually applied
    const constructPart = query.substring(
      query.indexOf("CONSTRUCT"),
      query.indexOf("WHERE"),
    );

    // Check that geoFeature variable is used consistently
    const geoFeatureVarMatch = constructPart.match(/\?geoFeature_\d+/);
    if (geoFeatureVarMatch) {
      const geoFeatureVar = geoFeatureVarMatch[0];
      expect(wherePart).toContain(geoFeatureVar);
    }
  });
});
