import type { Tester } from "@jsonforms/core";
import { extractTypeIRI } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";

export const typeIRIIs =
  (iri: string): Tester =>
  (_u, schema) =>
    extractTypeIRI(schema as JSONSchema7) === iri;

/**
 * Match logical type name via `config.typeIRIToTypeName` on the JSON Forms tester context
 * (we pass `DetailTesterContext` as `config`).
 */
export const typeNameIs =
  (name: string): Tester =>
  (_u, schema, ctx) => {
    const iri = extractTypeIRI(schema as JSONSchema7);
    if (!iri) return false;
    const map = (
      ctx as {
        config?: { typeIRIToTypeName?: (x: string) => string | undefined };
      }
    )?.config?.typeIRIToTypeName;
    return map ? map(iri) === name : false;
  };

export const shapeHasProperty =
  (prop: string): Tester =>
  (_u, schema) =>
    Boolean((schema as JSONSchema7 | undefined)?.properties?.[prop]);
