/**
 * Numeric filter operators for SPARQL
 * Implements: gt, gte, lt, lte
 */

import { sparql } from "@tpluscode/sparql-builder";
import df from "@rdfjs/data-model";
import { xsd } from "@tpluscode/rdf-ns-builders";
import type { FilterContext, FilterResult } from "../types";
import { castToInteger } from "../utils/cast";

/**
 * Numeric comparison operators: gt, gte, lt, lte
 * { age: { gte: 18 } } => ?person :age ?age . FILTER(?age >= 18)
 */
export function applyNumericOperator(
  operator: "gt" | "gte" | "lt" | "lte",
  value: number,
  context: FilterContext,
): FilterResult {
  const { subject, predicateNode, propertyVar } = context;

  const opSymbol = {
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
  }[operator];

  // Cast variable to integer to ensure type-safe comparison
  const castVar = castToInteger(propertyVar);
  const valueLiteral = df.literal(String(value), xsd.integer);

  return {
    patterns: [sparql`${subject} ${predicateNode} ${propertyVar} .`],
    filters: [sparql`FILTER(${castVar} ${opSymbol} ${valueLiteral})`],
    optional: false,
  };
}
