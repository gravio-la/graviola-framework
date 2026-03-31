import type { JSONSchema7 } from "json-schema";

/**
 * Canonical test schema shared across all datastore adapters.
 *
 * Deliberately kept simple:
 * - No self-referential types (Prisma-friendly)
 * - Three types: Category (flat), Tag (flat), Item (nested refs)
 * - Covers: string, number, boolean, single $ref, array $ref
 *
 * Same IRI namespace as used in apps/testapp to allow future cross-app comparison.
 */
export const BASE_IRI = "http://example.org/test/";

export const typeNameToTypeIRI = (typeName: string): string =>
  `${BASE_IRI}${typeName}`;

export const typeIRItoTypeName = (iri: string): string =>
  iri.replace(BASE_IRI, "");

export const propertyToIRI = (property: string): string =>
  `${BASE_IRI}${property}`;

export const entityIRI = (typeName: string, id: string): string =>
  `${BASE_IRI}${typeName}/${id}`;

export const rawTestSchema = {
  definitions: {
    Category: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
      required: ["name"],
    },
    Tag: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
      required: ["name"],
    },
    Item: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        price: { type: "number" },
        isAvailable: { type: "boolean" },
        category: { $ref: "#/definitions/Category" },
        tags: {
          type: "array",
          items: { $ref: "#/definitions/Tag" },
        },
      },
      required: ["name"],
    },
  },
} satisfies JSONSchema7;

export type TestTypeName = "Category" | "Tag" | "Item";

export const primaryFields = {
  Category: { label: "name", description: "description" },
  Tag: { label: "name", description: "description" },
  Item: { label: "name", description: "description" },
} as const;

export const primaryFieldExtracts = {} as const;

/** SPARQL query build options — used by initSPARQLStore */
export const queryBuildOptions = {
  propertyToIRI,
  typeIRItoTypeName,
  primaryFields,
  primaryFieldExtracts,
};
