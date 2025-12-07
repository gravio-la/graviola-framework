/**
 * Main filter translator - converts WHERE clauses to SPARQL patterns
 */

import type { FilterContext, FilterResult } from "./types";
import { applyComparisonOperator } from "./operators/comparison";
import { applyNumericOperator } from "./operators/numeric";
import { applyStringOperator } from "./operators/string";
import { applyLogicalOperator } from "./operators/logical";
import { applyRelationshipOperator } from "./operators/relationship";

/**
 * Check if value is a node reference (object with @id property)
 */
function isNodeReference(value: any): value is { "@id": string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "@id" in value &&
    typeof value["@id"] === "string"
  );
}

/**
 * Check if object has any filter operators
 */
function hasFilterOperators(obj: any): boolean {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  const operators = [
    "equals",
    "not",
    "in",
    "notIn",
    "gt",
    "gte",
    "lt",
    "lte",
    "contains",
    "startsWith",
    "endsWith",
    "some",
    "every",
    "none",
    "AND",
    "OR",
    "NOT",
    "mode",
  ];
  return Object.keys(obj).some((key) => operators.includes(key));
}

/**
 * Main entry point: converts WHERE clause to SPARQL patterns
 * @param whereClause - Filter object for this property
 * @param context - Context information (now includes optional schema and validationMode)
 * @returns SPARQL patterns and filters
 */
export function filterToSparql(
  whereClause: any,
  context: FilterContext,
): FilterResult {
  const result: FilterResult = {
    patterns: [],
    filters: [],
    optional: false,
  };

  // Handle primitive value (shorthand for equals)
  if (typeof whereClause !== "object" || whereClause === null) {
    // { age: 25 } is shorthand for { age: { equals: 25 } }
    return applyComparisonOperator("equals", whereClause, context);
  }

  // Handle @id shorthand for relationships
  // { knows: { '@id': 'http://example.com/friend' } } is shorthand for { knows: { some: { '@id': '...' } } }
  if (isNodeReference(whereClause) && !hasFilterOperators(whereClause)) {
    return applyRelationshipOperator("some", whereClause, context);
  }

  // Process each operator in the filter
  for (const [operator, value] of Object.entries(whereClause)) {
    let opResult: FilterResult;

    switch (operator) {
      // Comparison operators
      case "equals":
      case "not":
      case "in":
      case "notIn":
        opResult = applyComparisonOperator(operator, value, context);
        break;

      // Numeric operators
      case "gt":
      case "gte":
      case "lt":
      case "lte":
        // Type assertion safe because validation should catch type mismatches
        opResult = applyNumericOperator(operator, value as number, context);
        break;

      // String operators
      case "contains":
      case "startsWith":
      case "endsWith":
        // Type assertion safe because validation should catch type mismatches
        opResult = applyStringOperator(
          operator,
          value as string,
          whereClause.mode,
          context,
        );
        break;

      // Logical operators
      case "AND":
      case "OR":
      case "NOT":
        opResult = applyLogicalOperator(operator, value, context);
        break;

      // Relationship operators
      case "some":
      case "every":
      case "none":
        opResult = applyRelationshipOperator(operator, value, context);
        break;

      case "mode":
        // Mode is handled by string operators, skip
        continue;

      default:
        throw new Error(`Unknown filter operator: ${operator}`);
    }

    result.patterns.push(...opResult.patterns);
    result.filters.push(...opResult.filters);
    result.optional = result.optional || opResult.optional;
  }

  return result;
}
