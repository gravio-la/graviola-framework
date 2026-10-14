import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateDefaultUISchema } from "@graviola/edb-ui-utils";
import type { ControlElement, JsonSchema, Layout } from "@jsonforms/core";
import { Resolve } from "@jsonforms/core";

import {
  resolveInlineArrayItemDetailUISchema,
  resolveInlineArrayItemSchema,
} from "./inlineArrayItemDetailUISchema";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const bundleFixture = JSON.parse(
  readFileSync(
    join(fixtureDir, "test-fixtures/kochbuch-rezept-from-bundle.json"),
    "utf8",
  ),
) as {
  schema: JsonSchema;
  rootSchema: JsonSchema;
  sideSchema: {
    detailUiSchemaScopeOverrides: Record<
      string,
      { scopeOverride: Record<string, ControlElement> }
    >;
  };
};

describe("resolveInlineArrayItemDetailUISchema (JSON Forms item schema shape)", () => {
  test("resolves detail layout when passed the array item schema (not the array schema)", () => {
    const rootSchema = bundleFixture.rootSchema;
    const rezeptSchema = bundleFixture.schema;
    const ui = generateDefaultUISchema(rezeptSchema, {
      rootSchema,
    }) as Layout;
    const zutatenControl = ui.elements.find(
      (el) => (el as ControlElement).scope === "#/properties/zutaten",
    ) as ControlElement;
    const arraySchema = rezeptSchema.properties!.zutaten as JsonSchema;
    const itemSchema = Resolve.schema(
      arraySchema,
      "items",
      rootSchema,
    ) as JsonSchema;
    const itemOverride =
      bundleFixture.sideSchema.detailUiSchemaScopeOverrides.ZutatInRezept
        ?.scopeOverride;

    const detailUi = resolveInlineArrayItemDetailUISchema({
      arraySchema: itemSchema,
      arrayControl: {
        ...zutatenControl,
        options: {
          ...zutatenControl.options,
          itemScopeOverride: itemOverride,
        },
      },
      rootSchema,
      path: "zutaten.0",
    });

    expect((detailUi as Layout).elements?.length).toBeGreaterThan(0);
    const scopes = (detailUi as Layout).elements.map(
      (el) => (el as ControlElement).scope,
    );
    expect(scopes).toContain("#/properties/menge");
    expect(scopes).toContain("#/properties/zutatFreitext");
  });

  test("resolveInlineArrayItemSchema accepts array or item schema", () => {
    const rootSchema = bundleFixture.rootSchema;
    const arraySchema = bundleFixture.schema.properties!.zutaten as JsonSchema;
    const fromArray = resolveInlineArrayItemSchema(arraySchema, rootSchema);
    const fromItem = resolveInlineArrayItemSchema(fromArray!, rootSchema);
    expect(fromArray?.type).toBe("object");
    expect(fromItem).toEqual(fromArray);
  });
});
