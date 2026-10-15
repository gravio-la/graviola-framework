import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import { buildTraversalSchema } from "@graviola/edb-graph-traversal";

import { buildFilterableSPARQLQuery } from "./buildTypedSPARQLQuery";

const BASE = "http://example.com/";

const orgSchema: JSONSchema7 = {
  type: "object",
  properties: {
    "@id": { type: "string" },
    name: { type: "string" },
    departments: {
      type: "array",
      items: { $ref: "#/definitions/Department" },
    },
  },
  definitions: {
    Department: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        title: { type: "string" },
        org: { $ref: "#/definitions/Organization" },
      },
    },
    Organization: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        departments: {
          type: "array",
          items: { $ref: "#/definitions/Department" },
        },
      },
    },
  },
};

const inverseMap = {
  Organization: { departments: "Department.org" },
};

describe("traversalSchema2construct nested typeName", () => {
  test("include on nested definition resolves inverse on child type", () => {
    const { query } = buildFilterableSPARQLQuery(
      `${BASE}Organization/o1`,
      `${BASE}Organization`,
      orgSchema,
      {
        typeName: "Organization",
        inverseMap,
        rootSchema: orgSchema,
        prefixMap: { "": BASE },
        include: {
          departments: true,
        },
        maxRecursion: 2,
      },
    );
    expect(query).toContain("?departments_1 :org ?subject");
  });

  test("prefers $ref definition name over parent typeName in nested context", () => {
    const traversal = buildTraversalSchema(orgSchema, {
      include: { departments: true },
    });
    expect(traversal.properties?.departments).toBeDefined();
    const { query } = buildFilterableSPARQLQuery(
      `${BASE}Organization/o1`,
      `${BASE}Organization`,
      orgSchema,
      {
        typeName: "Organization",
        inverseMap,
        rootSchema: orgSchema,
        prefixMap: { "": BASE },
        include: { departments: { select: { title: true } } },
        maxRecursion: 2,
      },
    );
    expect(query).toContain("?departments_1 :org ?subject");
  });
});
