/**
 * Utilities for inferring SPARQL datatypes from JavaScript values
 */

import df from "@rdfjs/data-model";
import { xsd } from "@tpluscode/rdf-ns-builders";

/**
 * Infer the appropriate XSD datatype for a JavaScript value
 *
 * @param value - The value to infer type for
 * @param schemaType - Optional JSON Schema type hint
 * @returns RDF literal with appropriate datatype
 */
export function inferDatatype(value: any, schemaType?: string): any {
  // Handle explicit schema type hints
  if (schemaType === "string") {
    return df.literal(String(value));
  }

  if (schemaType === "integer" || schemaType === "number") {
    return df.literal(String(value), xsd.integer);
  }

  if (schemaType === "boolean") {
    return df.literal(String(value), xsd.boolean);
  }

  // Infer from JavaScript type
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return df.literal(String(value), xsd.integer);
    } else {
      return df.literal(String(value), xsd.decimal);
    }
  }

  if (typeof value === "boolean") {
    return df.literal(String(value), xsd.boolean);
  }

  if (value instanceof Date) {
    return df.literal(value.toISOString(), xsd.dateTime);
  }

  // Default to string
  return df.literal(String(value));
}
