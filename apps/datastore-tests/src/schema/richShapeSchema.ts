import type { JSONSchema7 } from "json-schema";

import { BASE_IRI, propertyToIRI, typeIRItoTypeName } from "./testSchema";

/**
 * A schema with the shapes the canonical test schema leaves out on purpose,
 * and that real models are full of:
 *
 * - several multi-valued literal fields on one entity,
 * - an anonymous nested object (no `@id`: a blank node owned by its parent),
 * - an array of anonymous nested objects,
 * - a single and a multi-valued relation to named entities.
 *
 * These are the shapes where a save or load query can go wrong without any
 * value being wrong: nested objects that multiply with every save, and
 * queries whose cost is the product of the field sizes.
 */
export const richShapeSchema = {
  definitions: {
    Maker: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
      },
      required: ["name"],
    },
    /** Anonymous: no `@id`, lives and dies with the entity that holds it. */
    Measure: {
      type: "object",
      properties: {
        label: { type: "string" },
        value: { type: "number" },
        unit: { type: "string" },
      },
    },
    Device: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        formats: { type: "array", items: { type: "string" } },
        ports: { type: "array", items: { type: "string" } },
        colors: { type: "array", items: { type: "string" } },
        languages: { type: "array", items: { type: "string" } },
        pages: { type: "array", items: { type: "string" } },
        maker: { $ref: "#/definitions/Maker" },
        resellers: {
          type: "array",
          items: { $ref: "#/definitions/Maker" },
        },
        weight: { $ref: "#/definitions/Measure" },
        measures: {
          type: "array",
          items: { $ref: "#/definitions/Measure" },
        },
      },
      required: ["name"],
    },
  },
} satisfies JSONSchema7;

export const richShapeQueryBuildOptions = {
  propertyToIRI,
  typeIRItoTypeName,
  primaryFields: {
    Maker: { label: "name" },
    Device: { label: "name" },
  },
  primaryFieldExtracts: {},
} as const;

export const RICH_BASE_IRI = BASE_IRI;

/** The multi-valued literal fields of `Device`. */
export const RICH_LIST_FIELDS = [
  "formats",
  "ports",
  "colors",
  "languages",
  "pages",
] as const;
