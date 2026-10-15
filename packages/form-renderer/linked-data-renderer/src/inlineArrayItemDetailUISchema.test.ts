import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createUISchemata } from "../../../semantic-json-form/src/helper/createUISchemata";
import type { ControlElement, JsonSchema, Layout } from "@jsonforms/core";
import { prepareStubbedSchema } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import { generateDefaultUISchema } from "@graviola/edb-ui-utils";

import { resolveInlineArrayItemDetailUISchema } from "./inlineArrayItemDetailUISchema";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const bundleFixture = JSON.parse(
  readFileSync(
    join(fixtureDir, "test-fixtures/kochbuch-rezept-from-bundle.json"),
    "utf8",
  ),
) as {
  schema: JSONSchema;
  rootSchema: JsonSchema;
  sideSchema: {
    entityBaseIRI: string;
    typeNameLabelMap: Record<string, string>;
    detailUiSchemaScopeOverrides: Record<
      string,
      { scopeOverride: Record<string, ControlElement> }
    >;
    uischemaScopeOverrides?: Record<
      string,
      {
        mode?: "override" | "exclusive";
        scopeOverride?: Record<string, ControlElement>;
      }
    >;
    orderBy?: Record<
      string,
      Record<string, { field: string; direction?: string }>
    >;
  };
};

function definitionToTypeIRI(definitionName: string): string {
  return `${bundleFixture.sideSchema.entityBaseIRI}${definitionName}`;
}

function stubbedSchema(): JSONSchema7 {
  return prepareStubbedSchema(
    bundleFixture.schema as JSONSchema7,
    (modelName) => ({
      "@type": {
        const: definitionToTypeIRI(modelName.replace(/Stub$/, "")),
        type: "string",
      },
      "@id": { type: "string" },
    }),
  );
}

function zutatenArrayControl(schema: JsonSchema, rootSchema: JsonSchema) {
  const rezeptOverrides =
    bundleFixture.sideSchema.uischemaScopeOverrides?.Rezept;
  const ui = generateDefaultUISchema(schema, {
    rootSchema,
    scopeOverride: rezeptOverrides?.scopeOverride,
    mode: rezeptOverrides?.mode ?? "override",
    orderBy: bundleFixture.sideSchema.orderBy?.Rezept,
  }) as Layout;
  const control = ui.elements.find(
    (el) => (el as ControlElement).scope === "#/properties/zutaten",
  ) as ControlElement;
  if (!control) {
    throw new Error("expected zutaten control");
  }
  const itemOverride =
    bundleFixture.sideSchema.detailUiSchemaScopeOverrides.ZutatInRezept
      ?.scopeOverride;
  return {
    ...control,
    options: {
      ...control.options,
      itemScopeOverride: itemOverride,
    },
  };
}

describe("resolveInlineArrayItemDetailUISchema", () => {
  test("uses generated item layout when registry has anonymous @type stub", () => {
    const schema = stubbedSchema();
    const rootSchema = bundleFixture.rootSchema as JsonSchema;
    const { registry: uischemas } = createUISchemata(schema, {
      typeNameLabelMap: bundleFixture.sideSchema.typeNameLabelMap,
      definitionToTypeIRI,
    });

    const arrayControl = zutatenArrayControl(schema, rootSchema);
    const arraySchema = schema.properties!.zutaten as JsonSchema;

    const detail = resolveInlineArrayItemDetailUISchema({
      arraySchema,
      arrayControl,
      rootSchema,
      path: "zutaten",
      uischemas,
    }) as Layout;

    const scopes = (detail.elements ?? []).map(
      (el) => (el as ControlElement).scope,
    );
    expect(scopes).toEqual([
      "#/properties/menge",
      "#/properties/einheit",
      "#/properties/zutatRef",
      "#/properties/zutatFreitext",
    ]);
  });
});
