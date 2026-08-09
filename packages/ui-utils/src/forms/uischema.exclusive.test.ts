import { describe, expect, test } from "bun:test";
import type { JsonSchema, Layout } from "@jsonforms/core";
import { generateDefaultUISchema } from "./uischema";

const personSchema = {
  type: "object",
  properties: {
    lastName: { type: "string" },
    firstName: { type: "string" },
    employeeId: { type: "string" },
  },
} as JsonSchema;

describe("generateDefaultUISchema mode", () => {
  test("exclusive keeps only scopeOverride keys in declaration order", () => {
    const ui = generateDefaultUISchema(personSchema, {
      mode: "exclusive",
      scopeOverride: {
        "#/properties/lastName": {
          type: "Control",
          scope: "#/properties/lastName",
          label: "Nachname",
        },
        "#/properties/employeeId": {
          type: "Control",
          scope: "#/properties/employeeId",
        },
      },
    }) as Layout;

    expect(ui.type).toBe("VerticalLayout");
    expect(ui.elements).toHaveLength(2);
    expect(ui.elements[0]).toMatchObject({
      type: "Control",
      scope: "#/properties/lastName",
      label: "Nachname",
    });
    expect(ui.elements[1]).toMatchObject({
      type: "Control",
      scope: "#/properties/employeeId",
    });
  });

  test("override still walks all properties", () => {
    const ui = generateDefaultUISchema(personSchema, {
      mode: "override",
      scopeOverride: {
        "#/properties/lastName": {
          type: "Control",
          scope: "#/properties/lastName",
          label: "Nachname",
        },
      },
    }) as Layout;

    const scopes = ui.elements
      .filter((e) => (e as { scope?: string }).scope)
      .map((e) => (e as { scope: string }).scope);
    expect(scopes).toContain("#/properties/lastName");
    expect(scopes).toContain("#/properties/firstName");
    expect(scopes).toContain("#/properties/employeeId");
  });
});
