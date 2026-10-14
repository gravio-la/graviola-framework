import { describe, expect, test } from "bun:test";
import type { ControlElement, JsonSchema, Layout } from "@jsonforms/core";
import { generateDefaultDetailUISchema } from "./generateDefault";

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
    notes: { type: "string" },
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

describe("generateDefaultDetailUISchema orderBy", () => {
  test("merges options.orderBy on listed array slot", () => {
    const ui = generateDefaultDetailUISchema(schema, {
      layoutType: "TopLevelLayout",
      orderBy: {
        steps: { field: "position", direction: "asc" },
      },
    }) as Layout;

    const steps = controlForScope(ui, "#/properties/steps");
    expect(steps?.options?.orderBy).toEqual({
      field: "position",
      direction: "asc",
    });
    expect(controlForScope(ui, "#/properties/title")?.options?.orderBy).toBe(
      undefined,
    );
  });

  test("keeps existing override options and adds orderBy", () => {
    const ui = generateDefaultDetailUISchema(schema, {
      orderBy: { steps: { field: "position", direction: "desc" } },
      scopeOverride: {
        "#/properties/steps": {
          type: "Control",
          scope: "#/properties/steps",
          options: { foo: "bar" },
        },
      },
    }) as Layout;

    const steps = controlForScope(ui, "#/properties/steps");
    expect(steps?.options).toMatchObject({
      foo: "bar",
      orderBy: { field: "position", direction: "desc" },
    });
  });

  test("exclusive mode applies orderBy on overridden scopes", () => {
    const ui = generateDefaultDetailUISchema(schema, {
      mode: "exclusive",
      layoutType: "TopLevelLayout",
      orderBy: { steps: { field: "position", direction: "asc" } },
      scopeOverride: {
        "#/properties/steps": {
          type: "Control",
          scope: "#/properties/steps",
          label: "Steps",
        },
      },
    }) as Layout;

    expect(ui.elements).toHaveLength(1);
    expect(ui.elements[0]).toMatchObject({
      scope: "#/properties/steps",
      label: "Steps",
      options: { orderBy: { field: "position", direction: "asc" } },
    });
  });
});
