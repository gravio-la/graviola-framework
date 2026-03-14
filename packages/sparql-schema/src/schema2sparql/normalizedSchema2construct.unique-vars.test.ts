/**
 * Tests that SPARQL variables are globally unique across the entire query.
 *
 * Regression test for a bug where variables were named by nesting depth
 * (e.g., ?name_1, ?type_2) instead of a globally incrementing counter.
 * This caused collisions when multiple relations at the same depth shared
 * property names (e.g., both NextcloudGroup and MailingList having "name"),
 * creating impossible SPARQL joins that silently dropped results.
 */

import { describe, test, expect } from "bun:test";
import { JSONSchema7 } from "json-schema";
import { normalizeSchema } from "@graviola/edb-graph-traversal";
import { normalizedSchema2construct } from "./normalizedSchema2construct";
import { buildSPARQLConstructQuery } from "./buildSPARQLConstructQuery";

/**
 * Extract all distinct variable names (e.g. "name_0", "name_5") that share
 * the same base name (e.g. "name") from a SPARQL query string.
 */
function extractVarsByBase(query: string, baseName: string): string[] {
  const pattern = new RegExp(`\\?${baseName}_(\\d+)`, "g");
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(query)) !== null) {
    found.add(m[0]);
  }
  return [...found];
}

describe("normalizedSchema2construct - Unique Variable Names", () => {
  test("sibling object relations with overlapping property names get unique variables", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        nextcloudGroup: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            active: { type: "boolean" },
          },
        },
        mailingList: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            active: { type: "boolean" },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, {});
    const result = normalizedSchema2construct(
      "http://example.com/wc/1",
      "http://example.com/WorkingCircle",
      normalized,
      { prefixMap: { "": "http://example.com/" } },
    );

    const query = buildSPARQLConstructQuery(result, {
      "": "http://example.com/",
    });

    // "name" appears in both nextcloudGroup and mailingList -> must get 2 distinct variables
    const nameVars = extractVarsByBase(query, "name");
    expect(nameVars.length).toBe(2);

    const descVars = extractVarsByBase(query, "description");
    expect(descVars.length).toBe(2);

    const activeVars = extractVarsByBase(query, "active");
    expect(activeVars.length).toBe(2);
  });

  test("sibling array relations with overlapping item property names get unique variables", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        members: {
          type: "array",
          items: {
            type: "object",
            properties: {
              firstName: { type: "string" },
              email: { type: "string" },
            },
          },
        },
        subscribers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              firstName: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, {});
    const result = normalizedSchema2construct(
      "http://example.com/list/1",
      undefined,
      normalized,
      { prefixMap: { "": "http://example.com/" } },
    );

    const query = buildSPARQLConstructQuery(result, {
      "": "http://example.com/",
    });

    const firstNameVars = extractVarsByBase(query, "firstName");
    expect(firstNameVars.length).toBe(2);

    const emailVars = extractVarsByBase(query, "email");
    expect(emailVars.length).toBe(2);
  });

  test("deeply nested relations at same depth do not collide", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        coordinator: {
          type: "object",
          properties: {
            name: { type: "string" },
            nextcloudGroups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  active: { type: "boolean" },
                },
              },
            },
            mailingLists: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  active: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, {});
    const result = normalizedSchema2construct(
      "http://example.com/wc/1",
      undefined,
      normalized,
      { prefixMap: { "": "http://example.com/" } },
    );

    const query = buildSPARQLConstructQuery(result, {
      "": "http://example.com/",
    });

    // "name" appears 3 times: coordinator.name, nextcloudGroups[].name, mailingLists[].name
    const nameVars = extractVarsByBase(query, "name");
    expect(nameVars.length).toBe(3);

    // "active" appears 2 times
    const activeVars = extractVarsByBase(query, "active");
    expect(activeVars.length).toBe(2);
  });

  test("type variables for nested objects are unique", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        groupA: {
          type: "object",
          properties: {
            label: { type: "string" },
          },
        },
        groupB: {
          type: "object",
          properties: {
            label: { type: "string" },
          },
        },
      },
    };

    const normalized = normalizeSchema(schema, {});
    const result = normalizedSchema2construct(
      "http://example.com/entity/1",
      undefined,
      normalized,
      { prefixMap: { "": "http://example.com/" } },
    );

    const query = buildSPARQLConstructQuery(result, {
      "": "http://example.com/",
    });

    // Each nested object should have its own unique type variable
    const typeVars = extractVarsByBase(query, "var___type");
    expect(typeVars.length).toBe(2);
  });

  test("WorkingCircle-like schema produces no variable collisions", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        active: { type: "boolean" },
        coordinator: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            nextcloudGroups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  active: { type: "boolean" },
                },
              },
            },
            mailingLists: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  active: { type: "boolean" },
                },
              },
            },
          },
        },
        nextcloudGroup: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            active: { type: "boolean" },
          },
        },
        mailingList: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            active: { type: "boolean" },
          },
        },
      },
      required: ["name", "description"],
    };

    const normalized = normalizeSchema(schema, {});
    const result = normalizedSchema2construct(
      "http://ontology.winzlieb.eu/school#WorkingCircle/test",
      "http://ontology.winzlieb.eu/school#WorkingCircle",
      normalized,
      { prefixMap: { "": "http://ontology.winzlieb.eu/school#" } },
    );

    const query = buildSPARQLConstructQuery(result, {
      "": "http://ontology.winzlieb.eu/school#",
    });

    // "name" appears in 5 locations: root, coordinator.nextcloudGroups[].name,
    // coordinator.mailingLists[].name, nextcloudGroup.name, mailingList.name
    const nameVars = extractVarsByBase(query, "name");
    expect(nameVars.length).toBe(5);

    // "description" appears in 5 locations: root, coordinator.nextcloudGroups[],
    // coordinator.mailingLists[], nextcloudGroup, mailingList
    const descVars = extractVarsByBase(query, "description");
    expect(descVars.length).toBe(5);

    // "active" appears in 4 locations (not at root required level):
    // coordinator.nextcloudGroups[], coordinator.mailingLists[], nextcloudGroup, mailingList
    // PLUS at root
    const activeVars = extractVarsByBase(query, "active");
    expect(activeVars.length).toBe(5);
  });
});
