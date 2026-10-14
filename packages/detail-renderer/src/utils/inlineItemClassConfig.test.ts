import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import {
  definitionNameFromItemSchema,
  classLevelInlineGenerateOptions,
} from "./inlineItemClassConfig";

const zutatInRezeptDef: JSONSchema7 = {
  type: "object",
  properties: {
    "@type": { type: "string", const: "http://example.org/ZutatInRezept" },
    menge: { type: "number" },
    einheit: { type: "string" },
    zutatRef: { $ref: "#/definitions/Zutat" },
    zutatFreitext: { type: "string" },
  },
};

describe("definitionNameFromItemSchema", () => {
  it("reads definition name from $ref", () => {
    expect(
      definitionNameFromItemSchema({
        $ref: "#/definitions/ZutatInRezept",
      }),
    ).toBe("ZutatInRezept");
  });

  it("maps @type const through typeIRIToTypeName when $ref is absent", () => {
    const dereferenced = { ...zutatInRezeptDef };
    expect(
      definitionNameFromItemSchema(dereferenced, {
        typeIRIToTypeName: (iri) =>
          iri === "http://example.org/ZutatInRezept"
            ? "ZutatInRezept"
            : undefined,
      }),
    ).toBe("ZutatInRezept");
  });

  it("matches rootSchema definition by property keys and @type const", () => {
    const rootSchema: JSONSchema7 = {
      type: "object",
      definitions: { ZutatInRezept: zutatInRezeptDef },
    };
    const inlineItems = { ...zutatInRezeptDef };
    expect(
      definitionNameFromItemSchema(inlineItems, {
        rootSchema,
        resolvedItemSchema: inlineItems,
      }),
    ).toBe("ZutatInRezept");
  });
});

describe("classLevelInlineGenerateOptions", () => {
  it("picks uiSchemata ranks for dereferenced item schemas", () => {
    const rootSchema: JSONSchema7 = {
      type: "object",
      definitions: { ZutatInRezept: zutatInRezeptDef },
      properties: {
        zutaten: { type: "array", items: zutatInRezeptDef },
      },
    };
    const detailUiSchemata = {
      ZutatInRezept: {
        type: "VerticalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/menge",
            rank: 1,
          },
          {
            type: "Control",
            scope: "#/properties/einheit",
            rank: 2,
          },
          {
            type: "Control",
            scope: "#/properties/zutatRef",
            rank: 3,
          },
          {
            type: "Control",
            scope: "#/properties/zutatFreitext",
            rank: 4,
          },
        ],
      },
    };
    const opts = classLevelInlineGenerateOptions(
      zutatInRezeptDef,
      detailUiSchemata,
      undefined,
      {
        rootSchema,
        resolvedItemSchema: zutatInRezeptDef,
      },
    );
    expect(opts?.scopeOverride?.["#/properties/menge"]?.rank).toBe(1);
    expect(opts?.scopeOverride?.["#/properties/einheit"]?.rank).toBe(2);
  });
});
