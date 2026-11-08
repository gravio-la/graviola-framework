import type { JSONSchema7 } from "json-schema";

const orderBySpecSchema: JSONSchema7 = {
  type: "object",
  properties: {
    field: { type: "string" },
    direction: { enum: ["asc", "desc"] },
  },
  required: ["field"],
  additionalProperties: false,
};

const linkFilterSchema: JSONSchema7 = {
  type: "object",
  required: ["where"],
  properties: {
    where: { type: "object" },
    onUnresolved: { enum: ["ignore", "empty"] },
    description: { type: "string" },
    mode: { enum: ["override", "and"] },
  },
  additionalProperties: false,
};

const derivedDefaultSpecSchema: JSONSchema7 = {
  type: "object",
  properties: {
    path: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
  },
  required: ["path"],
  additionalProperties: false,
};

/**
 * AJV meta-schema for `.gra.side-schema.json` documents
 * ({@link GraviolaSideSchema}).
 */
export const graviolaSideSchemaDefinition: JSONSchema7 = {
  $id: "https://graviola.gra.one/schemas/graviola-side-schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  additionalProperties: false,
  properties: {
    schemaName: { type: "string", minLength: 1 },
    label: { type: "string" },
    description: { type: "string" },
    version: { type: "string" },
    cardImage: { type: "string" },
    color: { type: "string" },
    icon: { type: "string" },
    storageKey: { type: "string" },
    baseIRI: { type: "string" },
    entityBaseIRI: { type: "string" },
    primaryFields: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          label: { type: "string" },
          description: { type: "string" },
          image: { type: "string" },
        },
        additionalProperties: true,
      },
    },
    identifiers: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["slot", "mode"],
        properties: {
          slot: { type: "string" },
          mode: { enum: ["iri", "mirror", "key"] },
        },
        additionalProperties: false,
      },
    },
    typeNameLabelMap: {
      type: "object",
      additionalProperties: { type: "string" },
    },
    typeNameUiSchemaOptionsMap: {
      type: "object",
      additionalProperties: { type: "object" },
    },
    uischemaScopeOverrides: { type: "object" },
    detailUiSchemaScopeOverrides: { type: "object" },
    tableUiSchemaByType: { type: "object" },
    tableUiSchema: { type: "object" },
    menuUISchema: { type: "object" },
    menuSidebarConfig: { type: "object" },
    orderBy: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: orderBySpecSchema,
      },
    },
    defaults: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: derivedDefaultSpecSchema,
      },
    },
    assetClasses: {
      type: "object",
      additionalProperties: { enum: ["image", "file"] },
    },
    inverses: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: {
          type: "string",
          minLength: 1,
          pattern: "^[^.]+\\.[^.]+$",
        },
      },
    },
    linkFilters: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: linkFilterSchema,
      },
    },
    viewConfig: {
      type: "object",
      additionalProperties: false,
      properties: {
        detail: {
          type: "object",
          additionalProperties: false,
          properties: {
            uiSchemata: { type: "object" },
            detailLayoutType: { type: "string" },
            nesting: { type: "object" },
            article: { type: "object" },
            hideLinkedDataProperties: { type: "boolean" },
            linkedDataPropertyNames: {
              type: "array",
              items: { type: "string" },
            },
            hideHeaderPrimaryFields: { type: "boolean" },
            hiddenPropertyNames: {
              type: "array",
              items: { type: "string" },
            },
            alwaysShowPropertyNames: {
              type: "array",
              items: { type: "string" },
            },
            maxDepth: { type: "number" },
          },
        },
      },
    },
  },
};
