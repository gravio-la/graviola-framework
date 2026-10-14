import { describe, expect, test } from "bun:test";
import { NOT_APPLICABLE, type ControlElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

import { materialArrayOfLinkedItemTester } from "./materialArrayOfLinkedItemTester";
import { materialArrayInlineObjectWithNestingTester } from "./materialArrayInlineObjectWithNestingTester";

const emptyCtx = { rootSchema: {} } as never;

const zutatDef: JSONSchema7 = {
  type: "object",
  properties: {
    "@id": { type: "string" },
    "@type": { type: "string" },
    name: { type: "string" },
  },
};

const zutatInRezeptItem: JSONSchema7 = {
  type: "object",
  properties: {
    "@type": { type: "string", const: "http://example.org/ZutatInRezept" },
    zutatRef: { $ref: "#/definitions/Zutat" },
    zutatFreitext: { type: "string" },
    menge: { type: "number" },
    einheit: { type: "string" },
  },
};

const nestedInlineRoot: JSONSchema7 = {
  type: "object",
  definitions: { Zutat: zutatDef },
  properties: {
    zutaten: { type: "array", items: zutatInRezeptItem },
  },
};

const flatStepItem: JSONSchema7 = {
  type: "object",
  properties: {
    schrittNr: { type: "integer" },
    text: { type: "string" },
  },
};

const flatStepsRoot: JSONSchema7 = {
  type: "object",
  properties: {
    schritte: { type: "array", items: flatStepItem },
  },
};

const linkedTagItem: JSONSchema7 = {
  type: "object",
  properties: {
    "@id": { type: "string" },
    "@type": { type: "string" },
    label: { type: "string" },
  },
};

const linkedTagsRoot: JSONSchema7 = {
  type: "object",
  properties: {
    tags: { type: "array", items: linkedTagItem },
  },
};

const primitivesRoot: JSONSchema7 = {
  type: "object",
  properties: {
    keywords: { type: "array", items: { type: "string" } },
  },
};

function control(
  scope: string,
  options?: Record<string, unknown>,
): ControlElement {
  return {
    type: "Control",
    scope,
    ...(options ? { options } : {}),
  };
}

describe("materialArrayInlineObjectWithNestingTester", () => {
  test("rank 5 for nested inline object arrays (ref nested in anonymous item)", () => {
    const ui = control("#/properties/zutaten", {
      detail: { type: "VerticalLayout", elements: [] },
    });
    expect(
      materialArrayInlineObjectWithNestingTester(ui, nestedInlineRoot, {
        ...emptyCtx,
        rootSchema: nestedInlineRoot,
      }),
    ).toBe(5);
  });

  test("rank -1 for flat leaf-only inline object arrays", () => {
    const ui = control("#/properties/schritte");
    expect(
      materialArrayInlineObjectWithNestingTester(ui, flatStepsRoot, {
        ...emptyCtx,
        rootSchema: flatStepsRoot,
      }),
    ).toBe(NOT_APPLICABLE);
  });

  test("rank -1 for linked entity item arrays", () => {
    const ui = control("#/properties/tags");
    expect(
      materialArrayInlineObjectWithNestingTester(ui, linkedTagsRoot, {
        ...emptyCtx,
        rootSchema: linkedTagsRoot,
      }),
    ).toBe(NOT_APPLICABLE);
    expect(
      materialArrayOfLinkedItemTester(ui, linkedTagsRoot, {
        ...emptyCtx,
        rootSchema: linkedTagsRoot,
      }),
    ).toBe(5);
  });

  test("rank -1 for primitive arrays", () => {
    const ui = control("#/properties/keywords");
    expect(
      materialArrayInlineObjectWithNestingTester(ui, primitivesRoot, {
        ...emptyCtx,
        rootSchema: primitivesRoot,
      }),
    ).toBe(NOT_APPLICABLE);
  });
});
