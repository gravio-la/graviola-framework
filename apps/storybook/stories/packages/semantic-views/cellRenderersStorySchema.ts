import type { JSONSchema7 } from "json-schema";
import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { TableUiSchema } from "@graviola/edb-table-types";
import {
  VALUE_RENDERER_OPTION,
  VALUE_RENDERER_OPTIONS_KEY,
} from "@graviola/edb-detail-renderer-core";

import { SEMANTIC_VIEWS_EXAMPLE_NS } from "./semanticViewsStorySchema";

const typeConst = (name: string) => ({
  type: "string" as const,
  const: `${SEMANTIC_VIEWS_EXAMPLE_NS}${name}`,
});

/** Showcase schema for JSON-LD table cell renderer dispatch. */
export const cellRenderersStorySchema: JSONSchema7 = {
  type: "object",
  definitions: {
    ShopItem: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("ShopItem"),
        name: { type: "string", title: "Name" },
        category: { $ref: "#/definitions/Category" },
        rating: { type: "integer", title: "Rating" },
        price: { type: "integer", title: "Price" },
        releasedAt: { type: "string", format: "date-time", title: "Released" },
        tags: {
          type: "array",
          title: "Tags",
          items: { $ref: "#/definitions/Tag" },
        },
      },
    },
    Category: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Category"),
        name: { type: "string" },
      },
    },
    Tag: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Tag"),
        name: { type: "string" },
        description: { type: "string" },
        image: { type: "string" },
      },
    },
  },
};

export const cellRenderersPrimaryFields: PrimaryFieldDeclaration = {
  ShopItem: { label: "name", description: "name" },
  Category: { label: "name" },
  Tag: { label: "name", description: "description", image: "image" },
};

export function cellRenderersTypeNameToTypeIRI(typeName: string): string {
  return `${SEMANTIC_VIEWS_EXAMPLE_NS}${typeName}`;
}

export function cellRenderersTypeIRIToTypeName(
  iri: string,
): string | undefined {
  if (!iri.startsWith(SEMANTIC_VIEWS_EXAMPLE_NS)) return undefined;
  return iri.slice(SEMANTIC_VIEWS_EXAMPLE_NS.length);
}

export const shopItemTableUiSchema: TableUiSchema = {
  type: "Table",
  mode: "whitelist",
  columns: [
    { scope: "#/properties/name", label: "Name" },
    { scope: "#/properties/category", label: "Category" },
    {
      scope: "#/properties/rating",
      label: "Rating",
      options: { [VALUE_RENDERER_OPTION]: "fiveStar" },
    },
    {
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
    },
    { scope: "#/properties/releasedAt", label: "Released" },
    { scope: "#/properties/tags", label: "Tags" },
  ],
};

const categoryVintage = {
  "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Category`,
  "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}category/vintage`,
  name: "Vintage instruments",
};

const categoryModern = {
  "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Category`,
  "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}category/modern`,
  name: "Modern gear",
};

export const shopItemSamples: Record<string, unknown>[] = [
  {
    "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}ShopItem`,
    "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}shop-item/1`,
    name: "Fender Stratocaster '57 Reissue",
    category: categoryVintage,
    rating: 5,
    price: 249900,
    releasedAt: "2024-03-15T10:00:00.000Z",
    tags: [
      {
        "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
        "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/vintage`,
        name: "Vintage",
        description: "Collectible grade",
        image: "https://picsum.photos/seed/tag-vintage/200/150",
      },
      {
        "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
        "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/sale`,
        name: "On sale",
        image: "https://picsum.photos/seed/tag-sale/200/150",
      },
    ],
  },
  {
    "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}ShopItem`,
    "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}shop-item/2`,
    name: "Boss ME-80 Multi-Effects",
    category: categoryModern,
    rating: 4,
    price: 34900,
    releasedAt: "2023-11-02T14:30:00.000Z",
    tags: [
      {
        "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
        "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/handmade`,
        name: "Handmade",
        description: "Small-batch",
        image: "https://picsum.photos/seed/tag-handmade/200/150",
      },
    ],
  },
  {
    "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}ShopItem`,
    "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}shop-item/3`,
    name: "Martin D-28 Acoustic",
    category: categoryVintage,
    rating: 5,
    price: 329900,
    releasedAt: "2025-01-08T09:15:00.000Z",
    tags: [
      {
        "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
        "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/vintage`,
        name: "Vintage",
        image: "https://picsum.photos/seed/tag-vintage/200/150",
      },
      {
        "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
        "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/acoustic`,
        name: "Acoustic",
        image: "https://picsum.photos/seed/tag-acoustic/200/150",
      },
    ],
  },
];
