import type { JSONSchema7 } from "json-schema";

/** JSON Schema for CodeMirror YAML lint in the portal declaration editor. */
export const secondaryDataSourceDeclarationJsonSchema: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: [
    "id",
    "label",
    "authorityIRI",
    "enabled",
    "kind",
    "operations",
    "examples",
  ],
  properties: {
    id: { type: "string", minLength: 1 },
    label: { type: "string", minLength: 1 },
    description: { type: "string" },
    authorityIRI: { type: "string", format: "uri" },
    icon: { type: "string" },
    license: { type: "string" },
    homepage: { type: "string", format: "uri" },
    enabled: { type: "boolean" },
    kind: { enum: ["declarative", "adapter"] },
    adapterId: { type: "string" },
    auth: {
      oneOf: [
        {
          type: "object",
          properties: { mode: { const: "none" } },
          required: ["mode"],
        },
        {
          type: "object",
          properties: {
            mode: { enum: ["bearer", "header", "basic"] },
            secretRef: { type: "string" },
            header: { type: "string" },
          },
          required: ["mode", "secretRef"],
        },
        {
          type: "object",
          properties: {
            mode: { const: "pre-login" },
            login: { type: "object" },
            tokenPath: { type: "string" },
            ttlSeconds: { type: "number" },
            inject: {
              type: "object",
              properties: {
                header: { type: "string" },
                template: { type: "string" },
              },
              required: ["header", "template"],
            },
          },
          required: ["mode", "login", "tokenPath", "inject"],
        },
      ],
    },
    rateLimit: {
      type: "object",
      properties: {
        minIntervalMs: { type: "number" },
        max: { type: "number" },
        windowMs: { type: "number" },
      },
    },
    typeHints: {
      type: "object",
      additionalProperties: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
      },
    },
    operations: {
      type: "object",
      required: ["search", "getEntity"],
      properties: {
        search: { type: "object" },
        searchByType: {
          type: "object",
          additionalProperties: { type: "object" },
        },
        getEntity: { type: "object" },
        factsPreview: {
          type: "object",
          properties: {
            paths: { type: "object", additionalProperties: { type: "string" } },
          },
        },
      },
    },
    identifiers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          authorityIRI: { type: "string" },
          iriTemplate: { type: "string" },
        },
        required: ["path", "authorityIRI", "iriTemplate"],
      },
    },
    examples: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          operation: { type: "string" },
          input: { type: "object" },
          expect: { type: "object" },
        },
        required: ["id", "label", "operation", "input"],
      },
    },
  },
  additionalProperties: false,
};

export const declarativeMappingsJsonSchema: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  items: {
    type: "object",
    required: ["source", "target"],
    properties: {
      source: {
        type: "object",
        properties: {
          path: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
        },
        required: ["path"],
      },
      target: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
      mapping: {
        type: "object",
        properties: { strategy: { type: "object" } },
      },
    },
  },
};
