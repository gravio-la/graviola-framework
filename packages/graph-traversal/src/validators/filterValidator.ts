/**
 * Filter validator - validates WHERE clauses against JSON schemas using ajv
 *
 * This module provides runtime validation for filter clauses to ensure:
 * 1. Operators are valid for the property type (e.g., no 'gt' on strings)
 * 2. Filter values match the expected schema types
 * 3. Properties exist in the schema
 *
 * Validation can throw, warn, or be ignored based on FilterValidationMode
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { JSONSchema7 } from "json-schema";
import type { FilterValidationMode } from "@graviola/edb-core-types";
import type { NormalizedSchema } from "../normalizer/types";

/**
 * Validation error details
 */
export type FilterValidationError = {
  path: string[];
  property: string;
  operator: string;
  value: any;
  message: string;
  schemaType?: string;
};

/**
 * Validation result
 */
export type FilterValidationResult = {
  valid: boolean;
  errors: FilterValidationError[];
};

// Create a shared ajv instance
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * Operators valid for each JSON Schema type
 */
const VALID_OPERATORS_BY_TYPE: Record<string, Set<string>> = {
  string: new Set([
    "equals",
    "not",
    "in",
    "notIn",
    "contains",
    "startsWith",
    "endsWith",
    "mode",
  ]),
  number: new Set(["equals", "not", "in", "notIn", "lt", "lte", "gt", "gte"]),
  integer: new Set(["equals", "not", "in", "notIn", "lt", "lte", "gt", "gte"]),
  boolean: new Set(["equals", "not"]),
  // Special handling for date/time strings
  date: new Set(["equals", "not", "lt", "lte", "gt", "gte"]),
  datetime: new Set(["equals", "not", "lt", "lte", "gt", "gte"]),
};

// Logical operators are always valid
const LOGICAL_OPERATORS = new Set(["AND", "OR", "NOT"]);

/**
 * Get the JSON Schema type for a property
 */
function getPropertyType(
  propertyName: string,
  schema: JSONSchema7,
): string | string[] | undefined {
  if (!schema.properties || !schema.properties[propertyName]) {
    return undefined;
  }

  const propSchema = schema.properties[propertyName];
  if (typeof propSchema === "boolean") {
    return undefined;
  }

  // Check for format hints for date/time
  if (propSchema.format === "date") return "date";
  if (propSchema.format === "date-time" || propSchema.format === "dateTime") {
    return "datetime";
  }

  return propSchema.type;
}

/**
 * Check if an operator is valid for a given type
 */
function isOperatorValidForType(
  operator: string,
  schemaType: string | string[] | undefined,
): boolean {
  // Logical operators are always valid
  if (LOGICAL_OPERATORS.has(operator)) {
    return true;
  }

  if (!schemaType) {
    return true; // Can't validate without type info
  }

  // Handle array of types (union types in JSON Schema)
  if (Array.isArray(schemaType)) {
    // For union types, operator is valid if it's valid for ANY of the types
    return schemaType.some((type) => isOperatorValidForType(operator, type));
  }

  const validOps = VALID_OPERATORS_BY_TYPE[schemaType];
  if (!validOps) {
    // Unknown type, allow all operators
    return true;
  }

  return validOps.has(operator);
}

/**
 * Validate a single filter value against its schema type
 */
function validateFilterValue(
  value: any,
  schemaType: string | string[] | undefined,
  propertyName: string,
  schema: JSONSchema7,
): boolean {
  if (!schema.properties || !schema.properties[propertyName]) {
    return true; // Can't validate without schema
  }

  const propSchema = schema.properties[propertyName];
  if (typeof propSchema === "boolean") {
    return true;
  }

  try {
    const validate = ajv.compile(propSchema);
    return validate(value);
  } catch (error) {
    // If compilation fails, we can't validate
    return true;
  }
}

/**
 * Recursively validate a WHERE clause
 */
function validateWhereClause(
  whereClause: any,
  schema: JSONSchema7,
  path: string[] = [],
): FilterValidationError[] {
  const errors: FilterValidationError[] = [];

  if (!whereClause || typeof whereClause !== "object") {
    return errors;
  }

  for (const [key, value] of Object.entries(whereClause)) {
    // Handle logical operators
    if (LOGICAL_OPERATORS.has(key)) {
      const conditions = Array.isArray(value) ? value : [value];
      conditions.forEach((condition, index) => {
        errors.push(
          ...validateWhereClause(condition, schema, [
            ...path,
            `${key}[${index}]`,
          ]),
        );
      });
      continue;
    }

    // Get property type from schema
    const schemaType = getPropertyType(key, schema);

    // Property doesn't exist in schema
    if (schemaType === undefined && schema.properties) {
      errors.push({
        path,
        property: key,
        operator: "",
        value,
        message: `Property "${key}" does not exist in schema. Available properties: ${Object.keys(schema.properties).join(", ")}`,
      });
      continue;
    }

    // Handle shorthand (direct value)
    if (typeof value !== "object" || value === null) {
      // Direct value is shorthand for { equals: value }
      if (!validateFilterValue(value, schemaType, key, schema)) {
        errors.push({
          path: [...path, key],
          property: key,
          operator: "equals",
          value,
          message: `Value for property "${key}" does not match schema type ${schemaType}`,
          schemaType: Array.isArray(schemaType)
            ? schemaType.join(" | ")
            : schemaType,
        });
      }
      continue;
    }

    // Handle operator object
    for (const [operator, operatorValue] of Object.entries(value)) {
      // Check if operator is valid for this type
      if (!isOperatorValidForType(operator, schemaType)) {
        const typeStr = Array.isArray(schemaType)
          ? schemaType.join(" | ")
          : schemaType;
        const validOps = Array.isArray(schemaType)
          ? Array.from(
              new Set(
                schemaType.flatMap((t) =>
                  Array.from(VALID_OPERATORS_BY_TYPE[t] || []),
                ),
              ),
            )
          : Array.from(VALID_OPERATORS_BY_TYPE[schemaType as string] || []);

        errors.push({
          path: [...path, key],
          property: key,
          operator,
          value: operatorValue,
          message: `Operator "${operator}" is not valid for property "${key}" of type ${typeStr}. Valid operators: ${validOps.join(", ")}`,
          schemaType: typeStr,
        });
        // Skip value validation if operator is invalid
        continue;
      }

      // Validate the operator value (skip 'mode' as it's a modifier)
      if (
        operator !== "mode" &&
        operator !== "AND" &&
        operator !== "OR" &&
        operator !== "NOT"
      ) {
        // For 'in' and 'notIn', validate array elements
        if (
          (operator === "in" || operator === "notIn") &&
          Array.isArray(operatorValue)
        ) {
          operatorValue.forEach((item, index) => {
            if (!validateFilterValue(item, schemaType, key, schema)) {
              errors.push({
                path: [...path, key, operator, `[${index}]`],
                property: key,
                operator,
                value: item,
                message: `Value at index ${index} in "${operator}" array for property "${key}" does not match schema type ${schemaType}`,
                schemaType: Array.isArray(schemaType)
                  ? schemaType.join(" | ")
                  : schemaType,
              });
            }
          });
        } else if (
          !validateFilterValue(operatorValue, schemaType, key, schema)
        ) {
          errors.push({
            path: [...path, key, operator],
            property: key,
            operator,
            value: operatorValue,
            message: `Value for operator "${operator}" on property "${key}" does not match schema type ${schemaType}`,
            schemaType: Array.isArray(schemaType)
              ? schemaType.join(" | ")
              : schemaType,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate a WHERE clause against a schema
 *
 * @param whereClause - The WHERE clause to validate
 * @param schema - The normalized schema to validate against
 * @param mode - Validation mode: 'throw' | 'warn' | 'ignore'
 * @returns Validation result with errors if any
 *
 * @throws {Error} If mode is 'throw' and validation fails
 *
 * @example
 * ```typescript
 * const where = { email: { gt: 20 } }; // Invalid: gt on string
 * const result = validateFilter(where, schema, 'throw');
 * // Throws: "Operator 'gt' is not valid for property 'email' of type string"
 * ```
 */
export function validateFilter(
  whereClause: any,
  schema: NormalizedSchema | JSONSchema7,
  mode: FilterValidationMode = "ignore",
): FilterValidationResult {
  // Skip validation if mode is 'ignore'
  if (mode === "ignore") {
    return { valid: true, errors: [] };
  }

  const errors = validateWhereClause(whereClause, schema);
  const result: FilterValidationResult = {
    valid: errors.length === 0,
    errors,
  };

  // Handle validation mode
  if (!result.valid) {
    const errorMessages = errors.map(
      (err) =>
        `${err.path.length > 0 ? err.path.join(".") + "." : ""}${err.property}: ${err.message}`,
    );

    if (mode === "throw") {
      throw new Error(
        `Filter validation failed:\n${errorMessages.map((msg) => `  - ${msg}`).join("\n")}`,
      );
    } else if (mode === "warn") {
      console.warn(
        `[Filter Validation Warning] Filter may be invalid:\n${errorMessages.map((msg) => `  - ${msg}`).join("\n")}`,
      );
    }
  }

  return result;
}

/**
 * Validate filter for a nested property (used during graph traversal)
 * This is used when validating filters at different levels of the schema tree
 *
 * @param whereClause - The WHERE clause to validate
 * @param propertyName - The name of the property being filtered
 * @param parentSchema - The parent schema containing the property
 * @param mode - Validation mode
 * @returns Validation result
 *
 * Phase 3: This will be integrated into the SPARQL query builder
 * to validate filters as we walk through the schema tree
 */
export function validateNestedFilter(
  whereClause: any,
  propertyName: string,
  parentSchema: JSONSchema7,
  mode: FilterValidationMode = "ignore",
): FilterValidationResult {
  if (mode === "ignore") {
    return { valid: true, errors: [] };
  }

  // Extract the property schema
  if (!parentSchema.properties || !parentSchema.properties[propertyName]) {
    return { valid: true, errors: [] };
  }

  const propSchema = parentSchema.properties[propertyName];
  if (typeof propSchema === "boolean") {
    return { valid: true, errors: [] };
  }

  // Handle array items
  let targetSchema = propSchema;
  if (propSchema.type === "array" && propSchema.items) {
    const items = Array.isArray(propSchema.items)
      ? propSchema.items[0]
      : propSchema.items;
    if (typeof items === "object" && !Array.isArray(items)) {
      targetSchema = items as JSONSchema7;
    }
  }

  return validateFilter(whereClause, targetSchema, mode);
}
