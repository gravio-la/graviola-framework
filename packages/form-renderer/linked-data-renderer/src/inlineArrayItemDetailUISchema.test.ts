import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createUISchemata } from "../../../semantic-json-form/src/helper/createUISchemata";
import type { ControlElement, JsonSchema, Layout } from "@jsonforms/core";
import { prepareStubbedSchema } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import { generateDefaultUISchema } from "@graviola/edb-ui-utils";
import { defineGraviolaApp } from "../../../graviola-app-config/src/defineGraviolaApp";

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
    schemaName: string;
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
  return {
    ...control,
    options: {
      ...control.options,
      showSortButtons: true,
    },
  };
}

const zutatInRezeptFormOverrides = {
  mode: "override" as const,
  scopeOverride:
    bundleFixture.sideSchema.detailUiSchemaScopeOverrides.ZutatInRezept
      ?.scopeOverride,
};

describe("resolveInlineArrayItemDetailUISchema", () => {
  test("uses class form uischema from app config (not array itemScopeOverride)", () => {
    const schema = stubbedSchema();
    const rootSchema = bundleFixture.rootSchema as JsonSchema;
    const { registry: uischemas } = createUISchemata(schema, {
      typeNameLabelMap: bundleFixture.sideSchema.typeNameLabelMap,
      definitionToTypeIRI,
    });

    const appConfig = defineGraviolaApp({
      schemaName: bundleFixture.sideSchema.schemaName ?? "kochbuch",
      label: "Kochbuch",
      description: "",
      version: "0.1.0",
      storageKey: "kochbuch",
      baseIRI: bundleFixture.sideSchema.entityBaseIRI,
      entityBaseIRI: bundleFixture.sideSchema.entityBaseIRI,
      schema: bundleFixture.schema as JSONSchema7,
      primaryFields: {},
      typeNameLabelMap: bundleFixture.sideSchema.typeNameLabelMap,
      typeNameUiSchemaOptionsMap: {},
      uischemaScopeOverrides: {
        ZutatInRezept: zutatInRezeptFormOverrides,
      },
      orderBy: bundleFixture.sideSchema.orderBy,
    });

    const arrayControl = zutatenArrayControl(schema, rootSchema);
    const arraySchema = schema.properties!.zutaten as JsonSchema;

    const detail = resolveInlineArrayItemDetailUISchema({
      arraySchema,
      arrayControl,
      rootSchema,
      path: "zutaten",
      uischemas,
      config: {
        uischemata: appConfig.uischemata,
        uischemaScopeOverrides: appConfig.uischemaScopeOverrides,
        orderBy: appConfig.orderBy,
        typeIRIToTypeName: (iri: string) =>
          iri.replace(bundleFixture.sideSchema.entityBaseIRI, ""),
      },
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
