/** Minimal JSON Schema (draft-07–compatible) for validating `SearchFacetSchema` documents */
export const searchFacetSchemaDefinition = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    fulltextIndex: {
      type: "object",
      properties: {
        scopes: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: { weight: { type: "number" } },
            additionalProperties: true,
          },
        },
        types: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: { searchable: { type: "boolean" } },
            additionalProperties: true,
          },
        },
      },
      additionalProperties: true,
    },
    facets: {
      type: "object",
      properties: {
        scopes: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              facet: { enum: ["filter", "range"] },
              label: { type: "string" },
              kind: { type: "string" },
              order: { type: "number" },
              multi: { type: "boolean" },
              maxValues: { type: "number" },
              quick: { type: "boolean" },
              numericField: { type: "string" },
            },
            required: ["facet"],
            additionalProperties: true,
          },
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
} as const;
