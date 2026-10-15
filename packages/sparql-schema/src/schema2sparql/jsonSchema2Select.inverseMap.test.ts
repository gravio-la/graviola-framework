import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import { jsonSchema2Select } from "./jsonSchema2Select";

const BASE = "http://example.com/";
const TYPE_IRI = `${BASE}Group`;

const groupSchemaNoKeyword: JSONSchema7 = {
  type: "object",
  properties: {
    "@id": { type: "string" },
    name: { type: "string" },
    members: {
      type: "array",
      items: { $ref: "#/definitions/Person" },
    },
  },
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        groups: {
          type: "array",
          items: { $ref: "#/definitions/Group" },
        },
      },
    },
    Group: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        members: {
          type: "array",
          items: { $ref: "#/definitions/Person" },
        },
      },
    },
  },
};

const inverseMap = {
  Group: { members: "Person.groups" },
  Person: { groups: "Group.members" },
};

describe("jsonSchema2Select with InverseMap", () => {
  test("list query uses inverse edge for map-declared array slot", () => {
    const query = jsonSchema2Select(
      groupSchemaNoKeyword,
      TYPE_IRI,
      [],
      ["members"],
      { typeName: "Group", inverses: inverseMap },
    );
    expect(query).toContain(":groups");
    expect(query).not.toContain(":members ?");
  });

  test("nested $ref walk uses item definition type for nested inverse slots", () => {
    const personSchema: JSONSchema7 = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        groups: {
          type: "array",
          items: { $ref: "#/definitions/Group" },
        },
      },
      definitions: groupSchemaNoKeyword.definitions,
    };
    const query = jsonSchema2Select(
      personSchema,
      `${BASE}Person`,
      [],
      ["groups"],
      { typeName: "Person", inverses: inverseMap },
    );
    expect(query).toContain(":members");
    expect(query).not.toMatch(/\?entity :groups/);
  });
});
