import { describe, expect, test } from "bun:test";
import { generateDefaultTableUiSchema } from "./generateDefaultTableUiSchema";

describe("generateDefaultTableUiSchema", () => {
  test("creates blacklist table schema from properties", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        birthDate: { type: "string" },
      },
    } as any;
    const ui = generateDefaultTableUiSchema(schema, { typeName: "Person" });
    expect(ui.type).toBe("Table");
    expect(ui.columns.map((c) => c.scope)).toEqual([
      "#/properties/name",
      "#/properties/birthDate",
    ]);
  });
});
