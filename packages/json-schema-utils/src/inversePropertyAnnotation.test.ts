import { JSONSchema7 } from "json-schema";
import {
  getInverseProperties,
  inverseMapFromSchema,
  JSONSchemaWithInverseProperties,
  resolveInverseForProperty,
  resolveInverseProperties,
} from "./inversePropertyAnnotations";
import { resolveSchema } from "./resolver";

const sampleSchema: any = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.com/person.schema.json",
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        parents: {
          type: "array",
          items: { $ref: "#/definitions/Person" },
        },
        children: {
          items: { $ref: "#/definitions/Person" },
          "x-inverseOf": {
            inverseOf: ["#/definitions/Person/properties/parents"],
          },
        },
      },
    },
  },
};

/** Minimal WorkingCircle-style schema: type with members array (x-inverseOf Person.workingCircles) */
const workingCircleRootSchema: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.com/school.schema.json",
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        workingCircles: {
          type: "array",
          items: { $ref: "#/definitions/WorkingCircle" },
        },
      },
    },
    WorkingCircle: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        members: {
          type: "array",
          title: "Mitglieder",
          items: { $ref: "#/definitions/Person" },
          "x-inverseOf": {
            inverseOf: ["#/definitions/Person/properties/workingCircles"],
          },
        } as JSONSchemaWithInverseProperties,
      },
    },
  },
};

describe("Inverse Property Annotation", () => {
  it("should resolve an inverse property annotation", () => {
    expect(
      resolveInverseProperties(
        sampleSchema.definitions.Person.properties.children,
        sampleSchema,
      ),
    ).toEqual([
      {
        path: ["parents"],
        typeName: "Person",
        schema: sampleSchema.definitions.Person.properties.parents,
      },
    ]);
  });
});

describe("inverseMapFromSchema and resolveInverseForProperty", () => {
  it("builds map from legacy x-inverseOf and resolves without keyword", () => {
    const map = inverseMapFromSchema(workingCircleRootSchema);
    expect(map.WorkingCircle?.members).toBe("Person.workingCircles");

    const wcDef = workingCircleRootSchema.definitions!
      .WorkingCircle as JSONSchema7;
    const membersSchema = wcDef.properties!.members as JSONSchema7;
    const withoutKeyword = { ...membersSchema };
    delete (withoutKeyword as { "x-inverseOf"?: unknown })["x-inverseOf"];

    expect(
      resolveInverseForProperty(
        "WorkingCircle",
        "members",
        withoutKeyword,
        workingCircleRootSchema,
        map,
      ),
    ).toEqual([
      {
        path: ["workingCircles"],
        typeName: "Person",
        schema: (workingCircleRootSchema.definitions!.Person as JSONSchema7)
          .properties!.workingCircles,
      },
    ]);
  });
});

describe("getInverseProperties", () => {
  it("should extract inverse data and entityIRIs from an array property (e.g. WorkingCircle.members)", () => {
    const workingCircleSchema = workingCircleRootSchema.definitions!
      .WorkingCircle as JSONSchema7;
    const doc = {
      "@id": "http://example.com/circle/1",
      "@type": "WorkingCircle",
      name: "Arbeitskreis IT",
      members: [
        { "@id": "http://example.com/person/1" },
        { "@id": "http://example.com/person/2" },
      ],
    };

    const result = getInverseProperties(
      workingCircleRootSchema,
      workingCircleSchema,
      doc,
      { typeName: "WorkingCircle" },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      path: ["workingCircles"],
      typeName: "Person",
      entityIRIs: [
        "http://example.com/person/1",
        "http://example.com/person/2",
      ],
    });
  });

  it("should return empty entityIRIs when members array is empty", () => {
    const workingCircleSchema = workingCircleRootSchema.definitions!
      .WorkingCircle as JSONSchema7;
    const doc = {
      "@id": "http://example.com/circle/1",
      name: "Empty Circle",
      members: [],
    };

    const result = getInverseProperties(
      workingCircleRootSchema,
      workingCircleSchema,
      doc,
      {
        typeName: "WorkingCircle",
        inverseMap: inverseMapFromSchema(workingCircleRootSchema),
      },
    );

    expect(result).toHaveLength(1);
    expect(result[0].entityIRIs).toEqual([]);
  });
});
