import { describe, expect, test } from "bun:test";
import type { JsonSchema, Layout } from "@jsonforms/core";
import { generateDefaultDetailUISchema } from "./generateDefault";

const schema = {
  type: "object",
  properties: {
    uniqueNumber: { type: "string" },
    partId: { type: "string" },
    notes: { type: "string" },
  },
} as JsonSchema;

describe("generateDefaultDetailUISchema mode", () => {
  test("exclusive emits only annotated scopes", () => {
    const ui = generateDefaultDetailUISchema(schema, {
      mode: "exclusive",
      layoutType: "TopLevelLayout",
      scopeOverride: {
        "#/properties/notes": {
          type: "Control",
          scope: "#/properties/notes",
          label: "Notizen",
        },
      },
    }) as Layout;

    expect(ui.type).toBe("TopLevelLayout");
    expect(ui.elements).toHaveLength(1);
    expect(ui.elements[0]).toMatchObject({
      scope: "#/properties/notes",
      label: "Notizen",
    });
  });
});
