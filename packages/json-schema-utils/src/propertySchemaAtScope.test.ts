import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import { bringDefinitionToTop } from "./jsonSchema";
import { propertySchemaAtScope } from "./propertySchemaAtScope";

const documentRoot: JSONSchema7 = {
  definitions: {
    ImageObject: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/ImageObject" },
      },
    },
    Fundstueck: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        image: { $ref: "#/definitions/ImageObject" },
        fotos: {
          type: "array",
          items: { $ref: "#/definitions/ImageObject" },
        },
        nested: {
          type: "object",
          properties: {
            thumb: { $ref: "#/definitions/ImageObject" },
          },
        },
      },
    },
  },
};

const formSchema = bringDefinitionToTop(documentRoot, "Fundstueck");

describe("propertySchemaAtScope", () => {
  it("returns terminal $ref without inlining the definition", () => {
    const atImage = propertySchemaAtScope(
      formSchema,
      "#/properties/image",
      formSchema,
    );
    expect(atImage).toEqual({ $ref: "#/definitions/ImageObject" });

    const atFotosItems = propertySchemaAtScope(
      formSchema,
      "#/properties/fotos/items",
      formSchema,
    );
    expect(atFotosItems).toEqual({ $ref: "#/definitions/ImageObject" });
  });

  it("walks nested inline object properties", () => {
    const atThumb = propertySchemaAtScope(
      formSchema,
      "#/properties/nested/properties/thumb",
      formSchema,
    );
    expect(atThumb).toEqual({ $ref: "#/definitions/ImageObject" });
  });

  it("returns array property schema with items ref intact", () => {
    const atFotos = propertySchemaAtScope(
      formSchema,
      "#/properties/fotos",
      formSchema,
    );
    expect(atFotos).toEqual({
      type: "array",
      items: { $ref: "#/definitions/ImageObject" },
    });
  });
});
