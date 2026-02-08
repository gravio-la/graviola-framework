import { JSONSchema7 } from "json-schema";

import { prepareStubbedSchema } from "./stubHelper";

const schemaWithEntities: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.com/person.schema.json",
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" }, // Entity with @id
        name: { type: "string" },
        description: { type: "string" },
        worksFor: { $ref: "#/definitions/Organization" },
      },
    },
    Organization: {
      type: "object",
      properties: {
        "@id": { type: "string" }, // Entity with @id
        title: { type: "string" },
      },
    },
  },
};

const schemaWithNonEntityRefs: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.com/plant.schema.json",
  definitions: {
    PlantSpecies: {
      type: "object",
      properties: {
        "@id": { type: "string" }, // Entity with @id
        name: { type: "string" },
        requirements: { $ref: "#/definitions/__schema0" }, // Non-entity ref (nested object)
      },
    },
    __schema0: {
      type: "object",
      properties: {
        sun: { type: "string" },
        water: { type: "string" },
      },
    },
  },
};

describe("JSON Schema Utility Functions", () => {
  it("should generate stubs only for entity schemas with @id", () => {
    const stub = prepareStubbedSchema(schemaWithEntities);

    expect(stub).toEqual({
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "https://example.com/person.schema.json",
      definitions: {
        PersonStub: {
          type: "object",
          properties: {
            "@id": {
              type: "string",
            },
            name: {
              type: "string",
            },
            description: {
              type: "string",
            },
          },
          required: [],
        },
        OrganizationStub: {
          type: "object",
          properties: {
            "@id": {
              type: "string",
            },
            title: {
              type: "string",
            },
          },
          required: [],
        },
        Person: {
          type: "object",
          properties: {
            "@id": {
              type: "string",
            },
            name: {
              type: "string",
            },
            description: {
              type: "string",
            },
            worksFor: {
              $ref: "#/definitions/OrganizationStub",
            },
          },
        },
        Organization: {
          type: "object",
          properties: {
            "@id": {
              type: "string",
            },
            title: {
              type: "string",
            },
          },
        },
      },
    });
  });

  it("should NOT create stubs for non-entity schemas (without @id)", () => {
    const stub = prepareStubbedSchema(schemaWithNonEntityRefs);

    // __schema0 should NOT have a stub because it doesn't have @id
    expect(stub.definitions).not.toHaveProperty("__schema0Stub");

    // PlantSpecies should have a stub because it has @id
    expect(stub.definitions).toHaveProperty("PlantSpeciesStub");

    // The ref to __schema0 should remain unchanged (not converted to __schema0Stub)
    const plantSpecies = stub.definitions?.PlantSpecies as JSONSchema7;
    const requirementsProp = plantSpecies.properties
      ?.requirements as JSONSchema7;
    expect(requirementsProp.$ref).toBe("#/definitions/__schema0");
  });
});
