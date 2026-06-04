import type { JSONSchema7 } from "json-schema";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import {
  VALUE_RENDERER_OPTION,
  VALUE_RENDERER_OPTIONS_KEY,
} from "@graviola/edb-detail-renderer-core";

import { SEMANTIC_VIEWS_EXAMPLE_NS } from "./semanticViewsStorySchema";

const typeConst = (name: string) => ({
  type: "string" as const,
  const: `${SEMANTIC_VIEWS_EXAMPLE_NS}${name}`,
});

export const valueRenderersStorySchema: JSONSchema7 = {
  type: "object",
  definitions: {
    Product: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Product"),
        name: { type: "string" },
        price: { type: "integer" },
        historicalStart: {
          type: "object",
          properties: {
            year: { type: "integer" },
          },
        },
        recordedAt: { type: "string", format: "date-time" },
      },
    },
  },
};

export const valueRenderersPrimaryFields: PrimaryFieldDeclaration = {
  Product: { label: "name", description: "name" },
};

export function valueRenderersTypeNameToTypeIRI(typeName: string): string {
  return `${SEMANTIC_VIEWS_EXAMPLE_NS}${typeName}`;
}

export function valueRenderersTypeIRIToTypeName(
  iri: string,
): string | undefined {
  if (!iri.startsWith(SEMANTIC_VIEWS_EXAMPLE_NS)) return undefined;
  return iri.slice(SEMANTIC_VIEWS_EXAMPLE_NS.length);
}

const currencyControl: ControlElement = {
  type: "Control",
  scope: "#/properties/price",
  label: "Price",
  options: {
    [VALUE_RENDERER_OPTION]: "currency",
    [VALUE_RENDERER_OPTIONS_KEY]: {
      currency: "EUR",
      unit: "minor",
      locale: "de-DE",
    },
  },
};

const historicalControl: ControlElement = {
  type: "Control",
  scope: "#/properties/historicalStart",
  label: "Period",
  options: {
    [VALUE_RENDERER_OPTION]: "historicalDate",
    [VALUE_RENDERER_OPTIONS_KEY]: { precision: "century" },
  },
};

const recordedAtControl: ControlElement = {
  type: "Control",
  scope: "#/properties/recordedAt",
  label: "Recorded at",
};

export const productDetailUiSchema: UISchemaElement = {
  type: "TopLevelLayout",
  elements: [
    {
      type: "VerticalLayout",
      elements: [currencyControl, historicalControl, recordedAtControl],
    },
  ],
};

export const productChipUiSchema: UISchemaElement = {
  type: "ChipLayout",
  elements: [
    {
      type: "VerticalLayout",
      elements: [currencyControl],
    },
  ],
};

export const productListItemUiSchema: UISchemaElement = {
  type: "ListItemLayout",
  elements: [historicalControl],
};

export const sampleProduct = {
  "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Product`,
  "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}product/1`,
  name: "Vintage camera",
  price: 1299,
  historicalStart: { year: 1450 },
  recordedAt: "2024-06-15T14:30:00.000Z",
};
