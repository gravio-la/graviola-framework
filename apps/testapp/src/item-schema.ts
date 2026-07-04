import type { JSONSchema7 } from "json-schema";
import type { SchemaConfig } from "./schemaTypes";
import { makeSchemaConfig } from "./makeSchemaConfig";
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
        /** Semantic relation between tags (EntityFinder + similarity drawer in forms). */
        relatedTags: {
          type: "array",
          items: {
            $ref: "#/definitions/Tag",
          },
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

export const itemSchemaConfig: SchemaConfig = makeSchemaConfig({
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
  detailUiSchemaScopeOverrides: {
    Item: {
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
        "#/properties/tags": {
          type: "Control",
          scope: "#/properties/tags",
          options: { containedAs: "card" },
        },
      },
    },
    Category: {
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
    Vendor: {
      skipScope: ["#/properties/logo"],
    },
  },
  uischemaScopeOverrides: {
    Category: {
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
    Item: {
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
    Tag: {
      scopeOverride: {
        "#/properties/relatedTags": {
          type: "Control",
          scope: "#/properties/relatedTags",
          label: "Related tags",
        },
      },
    },
  },
});
