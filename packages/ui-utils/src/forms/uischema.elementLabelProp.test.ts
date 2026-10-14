import { describe, expect, test } from "bun:test";
import type { ControlElement, JsonSchema, Layout } from "@jsonforms/core";
import { generateDefaultUISchema } from "./uischema";

const inlineIngredientArraySchema = {
  type: "object",
  properties: {
    zutaten: {
      type: "array",
      items: {
        type: "object",
        properties: {
          zutatRef: {
            type: "object",
            properties: {
              "@id": { type: "string" },
              name: { type: "string" },
            },
          },
          zutatFreitext: { type: "string" },
          menge: { type: "number" },
          einheit: { type: "string" },
        },
      },
    },
  },
} as JsonSchema;

function controlForScope(
  ui: Layout,
  scope: string,
): ControlElement | undefined {
  return ui.elements.find((e) => (e as ControlElement).scope === scope) as
    | ControlElement
    | undefined;
}

describe("generateDefaultUISchema inline array elementLabelProp", () => {
  test("sets elementLabelProps in declaration order including reference props", () => {
    const ui = generateDefaultUISchema(
      inlineIngredientArraySchema,
      {},
    ) as Layout;

    const zutaten = controlForScope(ui, "#/properties/zutaten");
    expect(zutaten?.options?.elementLabelProps).toEqual([
      "zutatRef",
      "zutatFreitext",
      "menge",
      "einheit",
    ]);
    expect(zutaten?.options?.elementLabelProp).toBe("zutatFreitext");
  });

  test("respects rank order among item properties when choosing label leaf", () => {
    const ui = generateDefaultUISchema(inlineIngredientArraySchema, {
      scopeOverride: {
        "#/properties/zutaten/items/properties/menge": {
          type: "Control",
          scope: "#/properties/zutaten/items/properties/menge",
          rank: 0,
        } as ControlElement & { rank: number },
        "#/properties/zutaten/items/properties/zutatFreitext": {
          type: "Control",
          scope: "#/properties/zutaten/items/properties/zutatFreitext",
          rank: 1,
        } as ControlElement & { rank: number },
      },
    }) as Layout;

    const zutaten = controlForScope(ui, "#/properties/zutaten");
    expect(zutaten?.options?.elementLabelProp).toBe("menge");
    expect(zutaten?.options?.elementLabelProps?.[0]).toBe("menge");
  });

  test("does not set elementLabelProp for arrays of named entities", () => {
    const schema = {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            type: "object",
            properties: {
              "@id": { type: "string" },
              label: { type: "string" },
            },
          },
        },
      },
    } as JsonSchema;

    const ui = generateDefaultUISchema(schema, {}) as Layout;
    expect(
      controlForScope(ui, "#/properties/tags")?.options?.elementLabelProp,
    ).toBeUndefined();
    expect(
      controlForScope(ui, "#/properties/tags")?.options?.elementLabelProps,
    ).toBeUndefined();
  });

  test("keeps explicit elementLabelProp from scopeOverride", () => {
    const ui = generateDefaultUISchema(inlineIngredientArraySchema, {
      scopeOverride: {
        "#/properties/zutaten": {
          type: "Control",
          scope: "#/properties/zutaten",
          options: { elementLabelProp: "einheit" },
        },
      },
    }) as Layout;

    expect(
      controlForScope(ui, "#/properties/zutaten")?.options?.elementLabelProp,
    ).toBe("einheit");
    expect(
      controlForScope(ui, "#/properties/zutaten")?.options?.elementLabelProps,
    ).toBeUndefined();
  });
});
