import { describe, expect, test } from "bun:test";
import type { ControlElement, JsonSchema, Layout } from "@jsonforms/core";
import { generateDefaultDetailUISchema } from "./generateDefault";

const rankedSchema = {
  type: "object",
  properties: {
    unrankedA: { type: "string" },
    rank3: { type: "string" },
    rank1: { type: "string" },
    unrankedB: { type: "string" },
    rank2: { type: "string" },
  },
} as JsonSchema;

function controlScopes(ui: Layout): string[] {
  return ui.elements
    .filter((e) => e.type === "Control")
    .map((e) => (e as ControlElement).scope);
}

describe("generateDefaultDetailUISchema rank", () => {
  test("sorts ranked scopeOverride controls ascending, unranked after in declaration order", () => {
    const ui = generateDefaultDetailUISchema(rankedSchema, {
      layoutType: "TopLevelLayout",
      scopeOverride: {
        "#/properties/rank3": {
          type: "Control",
          scope: "#/properties/rank3",
          rank: 3,
        } as ControlElement & { rank: number },
        "#/properties/rank1": {
          type: "Control",
          scope: "#/properties/rank1",
          rank: 1,
        } as ControlElement & { rank: number },
        "#/properties/rank2": {
          type: "Control",
          scope: "#/properties/rank2",
          rank: 2,
        } as ControlElement & { rank: number },
      },
    }) as Layout;

    expect(controlScopes(ui)).toEqual([
      "#/properties/rank1",
      "#/properties/rank2",
      "#/properties/rank3",
      "#/properties/unrankedA",
      "#/properties/unrankedB",
    ]);
  });

  test("leaves declaration order when no ranks are set", () => {
    const ui = generateDefaultDetailUISchema(rankedSchema, {
      layoutType: "TopLevelLayout",
    }) as Layout;

    expect(controlScopes(ui)).toEqual([
      "#/properties/unrankedA",
      "#/properties/rank3",
      "#/properties/rank1",
      "#/properties/unrankedB",
      "#/properties/rank2",
    ]);
  });

  test("single ranked control moves ahead of unranked", () => {
    const ui = generateDefaultDetailUISchema(rankedSchema, {
      layoutType: "TopLevelLayout",
      scopeOverride: {
        "#/properties/rank2": {
          type: "Control",
          scope: "#/properties/rank2",
          rank: 0,
        } as ControlElement & { rank: number },
      },
    }) as Layout;

    expect(controlScopes(ui)[0]).toBe("#/properties/rank2");
    expect(controlScopes(ui).slice(1)).toEqual([
      "#/properties/unrankedA",
      "#/properties/rank3",
      "#/properties/rank1",
      "#/properties/unrankedB",
    ]);
  });

  test("exclusive mode applies rank sort on root layout", () => {
    const ui = generateDefaultDetailUISchema(rankedSchema, {
      mode: "exclusive",
      layoutType: "TopLevelLayout",
      scopeOverride: {
        "#/properties/rank3": {
          type: "Control",
          scope: "#/properties/rank3",
          rank: 3,
        } as ControlElement & { rank: number },
        "#/properties/rank1": {
          type: "Control",
          scope: "#/properties/rank1",
          rank: 1,
        } as ControlElement & { rank: number },
        "#/properties/unrankedA": {
          type: "Control",
          scope: "#/properties/unrankedA",
        },
        "#/properties/rank2": {
          type: "Control",
          scope: "#/properties/rank2",
          rank: 2,
        } as ControlElement & { rank: number },
      },
    }) as Layout;

    expect(controlScopes(ui)).toEqual([
      "#/properties/rank1",
      "#/properties/rank2",
      "#/properties/rank3",
      "#/properties/unrankedA",
    ]);
  });
});
