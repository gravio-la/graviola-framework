import { describe, expect, it } from "bun:test";
import { rankWith, uiTypeIs } from "@jsonforms/core";
import type { ControlElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

import type { DetailTesterContext } from "../types";
import type { ValueRendererEntry } from "./types";
import { VALUE_RENDERER_OPTION } from "./types";
import { pickValueRenderer } from "./select";

const ctx: DetailTesterContext = {
  rootSchema: { type: "object" },
  depth: 1,
  maxDepth: 3,
};

const currencyEntry: ValueRendererEntry = {
  name: "currency",
  tester: () => -1,
  renderer: () => null,
};

const dateEntry: ValueRendererEntry = {
  name: "date",
  tester: rankWith(4, (_u, s) => (s as JSONSchema7).format === "date"),
  renderer: () => null,
};

const registry = [currencyEntry, dateEntry];

describe("pickValueRenderer", () => {
  it("picks by UI schema option name", () => {
    const uiSchema: ControlElement = {
      type: "Control",
      scope: "#/properties/price",
      options: { [VALUE_RENDERER_OPTION]: "currency" },
    };
    const schema: JSONSchema7 = { type: "integer" };
    expect(pickValueRenderer(registry, uiSchema, schema, ctx)?.name).toBe(
      "currency",
    );
  });

  it("falls back to tester when no explicit name", () => {
    const uiSchema: ControlElement = {
      type: "Control",
      scope: "#/properties/birthDate",
    };
    const schema: JSONSchema7 = { type: "string", format: "date" };
    expect(pickValueRenderer(registry, uiSchema, schema, ctx)?.name).toBe(
      "date",
    );
  });

  it("returns null when nothing matches", () => {
    const uiSchema: ControlElement = {
      type: "Control",
      scope: "#/properties/x",
    };
    const schema: JSONSchema7 = { type: "boolean" };
    expect(pickValueRenderer(registry, uiSchema, schema, ctx)).toBeNull();
  });

  it("returns null for unknown explicit name", () => {
    const uiSchema: ControlElement = {
      type: "Control",
      scope: "#/properties/x",
      options: { [VALUE_RENDERER_OPTION]: "missing" },
    };
    expect(
      pickValueRenderer(registry, uiSchema, { type: "string" }, ctx),
    ).toBeNull();
  });
});
