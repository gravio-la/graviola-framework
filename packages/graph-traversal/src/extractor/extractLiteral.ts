import type { JSONSchema7 } from "json-schema";
import type clownface from "clownface";
import type { ExtractionContext } from "./types";

/**
 * Helper to check if a value is nil (undefined or null)
 */
const isNil = (val: any): val is undefined | null =>
  val === undefined || val === null;

/**
 * Extracts a literal value (primitive) from an RDF node
 *
 * Handles type coercion based on the JSON Schema type:
 * - `string`: Returns the string value as-is
 * - `number`: Parses as float, returns undefined if NaN
 * - `integer`: Parses as int, returns undefined if NaN
 * - `boolean`: Converts "true"/"false" strings to boolean
 * - `null`: Returns null
 *
 * @param node The RDF node containing the literal value
 * @param schema The JSON Schema defining the expected type
 * @param ctx Extraction context for logging
 * @returns The extracted and coerced value, or undefined if missing/invalid
 *
 * @example
 * ```typescript
 * // String literal
 * const name = extractLiteral(node, { type: "string" }, ctx);
 * // → "John Doe"
 *
 * // Number literal
 * const age = extractLiteral(node, { type: "number" }, ctx);
 * // → 42
 *
 * // Boolean literal
 * const active = extractLiteral(node, { type: "boolean" }, ctx);
 * // → true
 * ```
 */
export function extractLiteral(
  node: clownface.GraphPointer,
  schema: JSONSchema7,
  ctx: ExtractionContext,
): string | number | boolean | null | undefined {
  const { logger } = ctx;

  // Get the first value from the node
  const values = node.values;

  if (!values || values.length === 0) {
    logger.debug("No literal value found", { schema: schema.type });
    return undefined;
  }

  const value = values[0];

  if (isNil(value)) {
    return undefined;
  }

  // Handle array of types (e.g., type: ["string", "null"])
  if (Array.isArray(schema.type)) {
    // Try to coerce to the first non-null type
    for (const type of schema.type) {
      if (type === "null" && (value === "null" || value === null)) {
        return null;
      }
      if (type === "string") {
        return value;
      }
      if (type === "number") {
        const num = parseFloat(value);
        if (!isNaN(num)) return num;
      }
      if (type === "integer") {
        const int = parseInt(value, 10);
        if (!isNaN(int)) return int;
      }
      if (type === "boolean") {
        if (value === "true") return true;
        if (value === "false") return false;
      }
    }
    return value; // Fallback to string
  }

  // Handle single type
  switch (schema.type) {
    case "number": {
      const num = parseFloat(value);
      if (isNaN(num)) {
        logger.warn("Failed to parse number", { value });
        return undefined;
      }
      return num;
    }

    case "integer": {
      const int = parseInt(value, 10);
      if (isNaN(int)) {
        logger.warn("Failed to parse integer", { value });
        return undefined;
      }
      return int;
    }

    case "boolean": {
      if (value === "true") return true;
      if (value === "false") return false;
      if (value === true) return true;
      if (value === false) return false;
      logger.warn("Invalid boolean value", { value });
      return undefined;
    }

    case "null":
      return null;

    case "string":
    default:
      return value;
  }
}
