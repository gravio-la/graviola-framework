import { JSONSchema7 } from "json-schema";
import { extendDefinitionsWithProperties } from "@graviola/json-schema-utils";
import { schemaExpander } from "./makeStubSchema";

export const schemaName = "exhibition-import-demo";

export const BASE_IRI = "http://ontologies.slub-dresden.de/exhibition#";

const rawSchema: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://schema.adb.arthistoricum.net/exhibition-import-demo#v1",
  title: "SLUB Ausstellungsdatenbank (Import Demo)",
  $defs: {
    Occupation: {
      type: "object",
      properties: {
        title: {
          type: "string",
          maxLength: 200,
        },
        description: {
          type: "string",
        },
        parent: {
          title: "Übergeordneter Beruf",
          $ref: "#/$defs/Occupation",
        },
      },
    },
    Person: {
      type: "object",
      properties: {
        name: {
          type: "string",
          maxLength: 200,
        },
        description: {
          type: "string",
        },
        birthDate: {
          type: "integer",
        },
        deathDate: {
          type: "integer",
        },
        profession: {
          type: "array",
          items: {
            $ref: "#/$defs/Occupation",
          },
        },
        nameVariant: {
          type: "array",
          items: {
            type: "string",
          },
        },
        gender: {
          type: "string",
          maxLength: 1,
          oneOf: [
            { const: "m", title: "männlich" },
            { const: "f", title: "weiblich" },
            { const: "d", title: "divers" },
            { const: "u", title: "unbekannt" },
          ],
        },
        personDeceased: {
          type: "boolean",
        },
        externalId: {
          type: "string",
          maxLength: 50,
        },
        birthPlace: {
          title: "Geburtsort",
          $ref: "#/$defs/Place",
        },
        memberOfCorp: {
          type: "array",
          items: {
            $ref: "#/$defs/Corporation",
          },
        },
        image: {
          type: "string",
          format: "uri",
          contentMediaType: "image/*",
        },
      },
    },
    Location: {
      type: "object",
      properties: {
        title: {
          type: "string",
          maxLength: 200,
        },
        titleVariants: {
          type: "string",
          maxLength: 600,
        },
        description: {
          type: "string",
        },
        image: {
          type: "string",
          format: "uri",
          contentMediaType: "image/*",
        },
        parent: {
          title: "Übergeordneter Ort",
          $ref: "#/$defs/Location",
        },
      },
    },
    Place: {
      type: "object",
      properties: {
        title: {
          type: "string",
          maxLength: 200,
        },
        description: {
          type: "string",
        },
        titleVariants: {
          type: "string",
          maxLength: 600,
        },
        location: {
          $ref: "#/$defs/Location",
        },
        parent: {
          title: "Übergeordnete Stätte",
          $ref: "#/$defs/Place",
        },
        image: {
          type: "string",
          format: "uri",
          contentMediaType: "image/*",
        },
      },
    },
    Corporation: {
      type: "object",
      properties: {
        name: {
          type: "string",
          maxLength: 200,
        },
        description: {
          type: "string",
        },
        nameVariant: {
          type: "array",
          items: {
            type: "string",
          },
        },
        parent: {
          title: "Übergeordnete Organisation",
          $ref: "#/$defs/Corporation",
        },
        location: {
          $ref: "#/$defs/Location",
        },
        image: {
          type: "string",
          format: "uri",
          contentMediaType: "image/*",
        },
      },
    },
    Exhibition: {
      type: "object",
      properties: {
        title: {
          type: "string",
          maxLength: 200,
        },
        description: {
          type: "string",
        },
      },
    },
  },
};

export const schema = extendDefinitionsWithProperties(
  rawSchema,
  () => schemaExpander.additionalProperties,
  undefined,
  schemaExpander.options,
);
