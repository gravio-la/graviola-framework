import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import { removeInversePropertiesFromSchema } from "@graviola/jsonld-utils";

import { jsonSchema2construct } from "./jsonSchema2construct";

const SUBJECT_IRI = "http://example.com/group/1";

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
};

describe("jsonSchema2construct with InverseMap (no x-inverseOf)", () => {
  test("WHERE uses inverse pattern via side-schema map", () => {
    const { whereOptionals, construct } = jsonSchema2construct(
      SUBJECT_IRI,
      groupSchemaNoKeyword,
      [],
      [],
      4,
      { typeName: "Group", inverseMap },
    );
    expect(whereOptionals).toContain(":groups");
    expect(whereOptionals).toContain(SUBJECT_IRI);
    expect(construct).toContain(":groups");
    expect(construct).not.toContain(":members ?");
  });

  test("removeInversePropertiesFromSchema strips map-declared inverse slots", () => {
    const clean = removeInversePropertiesFromSchema(groupSchemaNoKeyword, {
      typeName: "Group",
      inverseMap,
    });
    const { construct, whereOptionals } = jsonSchema2construct(
      SUBJECT_IRI,
      clean,
      [],
      [],
      4,
      { typeName: "Group", inverseMap },
    );
    expect(construct).not.toContain(":members");
    expect(whereOptionals).not.toContain(":members");
  });
});
