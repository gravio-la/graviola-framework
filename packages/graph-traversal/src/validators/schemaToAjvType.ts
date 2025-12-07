/**
 * Schema to AJV type mapping utilities
 *
 * Helpers for extracting and working with JSON Schema types
 * for filter validation
 */

import type { JSONSchema7 } from "json-schema";

/**
 * Property type information extracted from schema
 */
export type PropertyTypeInfo = {
  /** JSON Schema type(s) */
  type: string | string[];
  /** Format hint (e.g., 'date-time', 'email') */
  format?: string;
  /** Whether the property is an array */
  isArray: boolean;
  /** Whether the property is an object */
  isObject: boolean;
  /** The full property schema */
  schema: JSONSchema7;
};

/**
 * Get type information for a property from a schema
 *
 * @param propertyName - The name of the property
 * @param schema - The schema containing the property
 * @returns Property type information or undefined if property not found
 *
 * @example
 * ```typescript
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number' }
 *   }
 * };
 *
 * const nameType = getSchemaTypeForProperty('name', schema);
 * // { type: 'string', isArray: false, isObject: false, schema: {...} }
 * ```
 */
export function getSchemaTypeForProperty(
  propertyName: string,
  schema: JSONSchema7,
): PropertyTypeInfo | undefined {
  if (!schema.properties || !schema.properties[propertyName]) {
    return undefined;
  }

  const propSchema = schema.properties[propertyName];
  if (typeof propSchema === "boolean") {
    return undefined;
  }

  const isArray = propSchema.type === "array";
  const isObject = propSchema.type === "object";

  return {
    type: propSchema.type || "any",
    format: propSchema.format,
    isArray,
    isObject,
    schema: propSchema,
  };
}

/**
 * Get the element type for an array property
 *
 * @param propertySchema - The array property schema
 * @returns The element type schema or undefined
 */
export function getArrayElementType(
  propertySchema: JSONSchema7,
): JSONSchema7 | undefined {
  if (propertySchema.type !== "array" || !propertySchema.items) {
    return undefined;
  }

  const items = Array.isArray(propertySchema.items)
    ? propertySchema.items[0]
    : propertySchema.items;

  if (typeof items === "boolean") {
    return undefined;
  }

  return items as JSONSchema7;
}

const has = (key: string | string[] | undefined, value: string): boolean => {
  if (!key) return false;
  if (typeof key === "string") {
    return key === value;
  }
  return key.includes(value);
};

/**
 * Check if a schema type is numeric (number or integer)
 */
export const isNumericType = (type: string | string[] | undefined): boolean =>
  has(type, "number") || has(type, "integer");

/**
 * Check if a schema type is a string
 */
export const isStringType = (type: string | string[] | undefined): boolean =>
  has(type, "string");

/**
 * Check if a schema type is a boolean
 */
export const isBooleanType = (type: string | string[] | undefined): boolean =>
  has(type, "boolean");

/**
 * Check if a property is a date/time field based on format
 */
export const isDateTimeType = (
  _type: string | string[] | undefined,
  format?: string,
): boolean =>
  has(format, "date") ||
  has(format, "date-time") ||
  has(format, "dateTime") ||
  has(format, "time");

/**
 * Get a human-readable type description
 */
export const getTypeDescription = (typeInfo: PropertyTypeInfo): string => {
  if (typeInfo.format) {
    return `${typeInfo.type} (format: ${typeInfo.format})`;
  }
  if (Array.isArray(typeInfo.type)) {
    return typeInfo.type.join(" | ");
  }
  return typeInfo.type;
};

/**
 * Normalize a schema type to a canonical form
 * Handles format hints and type arrays
 */
export function normalizeSchemaType(
  type: string | string[] | undefined,
  format?: string,
): string | string[] {
  // Handle date/time formats
  if (format === "date") return "date";
  if (format === "date-time" || format === "dateTime") return "datetime";

  // Handle undefined
  if (!type) return "any";

  // Handle integer as number
  if (Array.isArray(type)) {
    return type.map((t) => (t === "integer" ? "number" : t));
  }
  return type === "integer" ? "number" : type;
}
