import type { JsonSchema } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { generateDefaultUISchema } from "@graviola/edb-ui-utils";
import { generateDefaultDetailUISchema } from "@graviola/edb-detail-renderer";
import type { SchemaConfig } from "./schemaTypes";
import { exampleDataTurtle } from "./item-fixture";
import { publicAssetUrl } from "./publicAssetUrl";

const type = (name: string) => ({
  type: "string",
  const: `http://www.example.org/example/${name}`,
});
export const schema = {
  type: "object",
  definitions: {
    Category: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": type("Category"),
        name: {
          type: "string",
        },
        image: {
          type: "string",
        },
        description: {
          type: "string",
        },
        basePrice: {
          type: "integer",
          minimum: 0,
        },
        subCategories: {
          type: "array",
          items: {
            $ref: "#/definitions/Category",
          },
          "x-inverseOf": {
            inverseOf: ["#/definitions/Category/properties/parentCategory"],
          },
        },
        parentCategory: {
          $ref: "#/definitions/Category",
        },
      },
      required: ["name"],
    },
    Item: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": type("Item"),
        name: {
          type: "string",
        },
        description: {
          type: "string",
        },
        parent: {
          $ref: "#/definitions/Item",
        },
        photos: {
          type: "array",
          items: {
            type: "string",
          },
        },
        condition: {
          type: "string",
        },
        category: {
          $ref: "#/definitions/Category",
        },
        vendor: {
          $ref: "#/definitions/Vendor",
        },
        tags: {
          type: "array",
          items: {
            $ref: "#/definitions/Tag",
          },
        },
        basePrice: {
          type: "integer",
          minimum: 0,
        },
        isAvailable: {
          type: "boolean",
          default: true,
        },
      },
    },
    Tag: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": type("Tag"),
        name: {
          type: "string",
        },
        description: {
          type: "string",
        },
        image: {
          type: "string",
        },
      },
    },
    Vendor: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": type("Vendor"),
        name: {
          type: "string",
        },
        description: {
          type: "string",
        },
        website: {
          type: "string",
        },
        email: {
          type: "string",
        },
        address: {
          type: "string",
        },
        logo: {
          type: "string",
        },
      },
      required: ["name"],
    },
  },
};

const itemJsonSchema = schema as unknown as JSONSchema7;

export const itemSchemaConfig: SchemaConfig = {
  schemaName: "item-schema",
  label: "Items catalog",
  description:
    "Categories, items, tags — generic CRUD with list, create, edit, and detail routes.",
  version: "0.1.0",
  cardImage: publicAssetUrl("item-schema-card.webp"),
  color: "#2e7d32",
  icon: "🛒",
  storageKey: "testapp-items",
  initialData: exampleDataTurtle,
  baseIRI: "http://www.example.org/",
  entityBaseIRI: "http://www.example.org/example/",
  schema: itemJsonSchema,
  primaryFields: {
    Category: {
      label: "name",
      description: "description",
      image: "image",
    },
    Item: {
      label: "name",
      description: "description",
      image: "photos",
    },
    Tag: {
      label: "name",
      description: "description",
      image: "image",
    },
    Vendor: {
      label: "name",
      description: "description",
      image: "logo",
    },
  },
  typeNameLabelMap: {
    Category: "Kategorie",
    Item: "Artikel",
    Tag: "Tag",
    Vendor: "Lieferant",
  },
  typeNameUiSchemaOptionsMap: {
    Category: {
      dropdown: true,
    },
    Tag: {
      chips: true,
    },
    Vendor: {
      dropdown: true,
    },
  },
  detailUiSchemata: {
    Item: generateDefaultDetailUISchema(
      bringDefinitionToTop(
        itemJsonSchema as any,
        "Item",
      ) as unknown as JsonSchema,
      {
        layoutType: "TopLevelLayout",
        skipScope: ["#/properties/photos"],
        scopeOverride: {
          "#/properties/basePrice": {
            type: "Control",
            scope: "#/properties/basePrice",
            label: "Preis (€)",
          },
          "#/properties/isAvailable": {
            type: "Control",
            scope: "#/properties/isAvailable",
            label: "Verfügbar",
          },
        },
      },
    ),
    Category: generateDefaultDetailUISchema(
      bringDefinitionToTop(
        itemJsonSchema as any,
        "Category",
      ) as unknown as JsonSchema,
      {
        layoutType: "TopLevelLayout",
        skipScope: ["#/properties/subCategories"],
        scopeOverride: {
          "#/properties/parentCategory": {
            type: "Control",
            scope: "#/properties/parentCategory",
            label: "Übergeordnete Kategorie",
          },
          "#/properties/basePrice": {
            type: "Control",
            scope: "#/properties/basePrice",
            label: "Basispreis (€)",
          },
        },
      },
    ),
    Vendor: generateDefaultDetailUISchema(
      bringDefinitionToTop(
        itemJsonSchema as any,
        "Vendor",
      ) as unknown as JsonSchema,
      {
        layoutType: "TopLevelLayout",
        skipScope: ["#/properties/logo"],
      },
    ),
  },
  uischemata: {
    Category: generateDefaultUISchema(
      bringDefinitionToTop(itemJsonSchema as any, "Category") as any,
      {
        scopeOverride: {
          "#/properties/subCategories": {
            type: "Control",
            scope: "#/properties/subCategories",
            options: {
              dropdown: true,
              chips: true,
            },
          },
        },
      },
    ),
    Item: generateDefaultUISchema(
      bringDefinitionToTop(itemJsonSchema as any, "Item") as any,
      {
        scopeOverride: {
          "#/properties/tags": {
            type: "Control",
            scope: "#/properties/tags",
            options: {
              chips: true,
              dropdown: true,
            },
          },
        },
      },
    ),
    Vendor: generateDefaultUISchema(
      bringDefinitionToTop(itemJsonSchema as any, "Vendor") as any,
      {},
    ),
  },
};
