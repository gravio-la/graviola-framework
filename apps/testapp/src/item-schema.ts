import type { JSONSchema7 } from "json-schema";
import {
  baseMetaSchemaProfile,
  deriveExtendedSchema,
  ENTITY_META_JSON_KEY,
  extendMetaSchema,
  type MetaStampingConfig,
} from "@graviola/meta-schema";
import { schemaIdentityOfSync } from "@graviola/json-schema-utils";
import type { TableUiSchema } from "@graviola/edb-table-types";
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

export const itemMetaSchema = extendMetaSchema(baseMetaSchemaProfile, {
  type: "object",
  properties: {
    reviewStatus: {
      type: "string",
      enum: ["draft", "in_review", "approved"],
      description: "https://example.org/reviewStatus",
    },
  },
});

const itemSchemaIdentity = schemaIdentityOfSync(itemJsonSchema);

export const itemMetaStamping: MetaStampingConfig = {
  schemaVersion: itemSchemaIdentity.version,
  schemaFingerprint: itemSchemaIdentity.fingerprint,
  rejectClientMeta: true,
  lifecycleTimestamps: "application",
};

export const itemExtendedSchema = deriveExtendedSchema(
  itemJsonSchema,
  itemMetaSchema,
  { includeLifecycle: true, graftPropertyKey: ENTITY_META_JSON_KEY },
);

const itemLifecycleTableUiSchema: TableUiSchema = {
  type: "Table",
  mode: "blacklist",
  columns: [
    {
      scope: "#/properties/$meta",
      visibility: "forbidden",
    },
    {
      scope: "#/properties/$meta/properties/created",
      label: "Created",
      visibility: "hiddenByDefault",
    },
    {
      scope: "#/properties/$meta/properties/modified",
      label: "Modified",
      visibility: "hiddenByDefault",
      sortable: true,
    },
  ],
};

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
  extendedSchema: itemExtendedSchema,
  metaStamping: itemMetaStamping,
  annotationMetaSchema: itemMetaSchema,
  tableUiSchema: itemLifecycleTableUiSchema,
  annotationDetailUiSchemaScopeOverrides: {
    Item: {
      scopeOverride: {
        "#/properties/created": {
          type: "Control",
          scope: "#/properties/created",
          label: "Erstellt",
        },
        "#/properties/modified": {
          type: "Control",
          scope: "#/properties/modified",
          label: "Geändert",
        },
        "#/properties/schemaFingerprint": {
          type: "Control",
          scope: "#/properties/schemaFingerprint",
          label: "Schema-Fingerprint",
        },
        "#/properties/reviewStatus": {
          type: "Control",
          scope: "#/properties/reviewStatus",
          label: "Review-Status",
        },
      },
    },
  },
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
      skipScope: ["#/properties/photos", "#/properties/$meta"],
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
