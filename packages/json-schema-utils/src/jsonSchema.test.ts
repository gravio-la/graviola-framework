import { JSONSchema7 } from "json-schema";

import { bringDefinitionToTop, isPrimitive } from "./jsonSchema";

describe("JSON Schema Utility Functions", () => {
  describe("isPrimitive", () => {
    test.each([
      ["string", true],
      ["number", true],
      ["integer", true],
      ["boolean", true],
      ["object", false],
      [undefined, false],
    ])("should return %s for %p type", (type, expected) => {
      expect(isPrimitive(type)).toBe(expected);
    });
  });

  describe("bringDefinitionToTop", () => {
    it("keeps the full root definitions map when the named definition embeds definitions", () => {
      const schema: JSONSchema7 = {
        definitions: {
          __schemaHelper: { type: "string" },
          GeoFeature: {
            type: "object",
            definitions: {},
            properties: {
              geo: { $ref: "#/definitions/__schemaHelper" },
            },
          },
        },
      };
      const top = bringDefinitionToTop(schema, "GeoFeature");
      expect(top.definitions).toEqual(schema.definitions);
      expect(top.definitions?.__schemaHelper).toEqual({ type: "string" });
    });
  });
});
