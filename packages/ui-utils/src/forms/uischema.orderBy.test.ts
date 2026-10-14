import { describe, expect, test } from "bun:test";
import type { ControlElement, JsonSchema, Layout } from "@jsonforms/core";
import { generateDefaultUISchema } from "./uischema";

const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: { position: { type: "integer" } },
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

describe("generateDefaultUISchema orderBy", () => {
  test("merges options.orderBy and showSortButtons on listed slots", () => {
    const ui = generateDefaultUISchema(schema, {
      orderBy: { steps: { field: "position", direction: "asc" } },
    }) as Layout;

    const steps = controlForScope(ui, "#/properties/steps");
    expect(steps?.options?.orderBy).toEqual({
      field: "position",
      direction: "asc",
    });
    expect(steps?.options?.showSortButtons).toBe(true);
  });

  test("keeps existing override options and adds orderBy", () => {
    const ui = generateDefaultUISchema(schema, {
      orderBy: { steps: { field: "position", direction: "asc" } },
      scopeOverride: {
        "#/properties/steps": {
          type: "Control",
          scope: "#/properties/steps",
          options: { detail: "accordion" },
        },
      },
    }) as Layout;

    const steps = controlForScope(ui, "#/properties/steps");
    expect(steps?.options).toMatchObject({
      detail: "accordion",
      orderBy: { field: "position", direction: "asc" },
      showSortButtons: true,
    });
  });

  test("exclusive mode applies orderBy on overridden scopes", () => {
    const ui = generateDefaultUISchema(schema, {
      mode: "exclusive",
      orderBy: { steps: { field: "position", direction: "asc" } },
      scopeOverride: {
        "#/properties/steps": {
          type: "Control",
          scope: "#/properties/steps",
        },
      },
    }) as Layout;

    expect(ui.elements[0]).toMatchObject({
      scope: "#/properties/steps",
      options: {
        orderBy: { field: "position", direction: "asc" },
        showSortButtons: true,
      },
    });
  });
});
