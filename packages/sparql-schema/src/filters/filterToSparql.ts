/**
 * Main filter translator - converts WHERE clauses to SPARQL patterns
 */

import type { FilterContext, FilterResult } from "./types";
import { applyComparisonOperator } from "./operators/comparison";
import { applyNumericOperator } from "./operators/numeric";
import { applyStringOperator } from "./operators/string";
import { applyLogicalOperator } from "./operators/logical";

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
