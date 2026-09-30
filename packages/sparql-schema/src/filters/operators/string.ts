/**
 * String filter operators for SPARQL
 */

import { sparql } from "@tpluscode/sparql-builder";
import df from "@rdfjs/data-model";
import type { FilterContext, FilterResult } from "../types";

/**
 * String operators: contains, startsWith, endsWith
 * Supports case-sensitive (default) and case-insensitive (mode: 'insensitive')
 */
export function applyStringOperator(
  operator: "contains" | "startsWith" | "endsWith",
  value: string,
  mode: "default" | "insensitive" = "default",
  context: FilterContext,
): FilterResult {
  const { subject, predicateNode, propertyVar } = context;

  const valueLiteral = df.literal(value);
  const func =
    operator === "contains"
      ? "CONTAINS"
      : operator === "startsWith"
        ? "STRSTARTS"
        : "STRENDS";

  const filterExpr =
    mode === "insensitive"
      ? sparql`FILTER(${func}(LCASE(STR(${propertyVar})), LCASE(${valueLiteral})))`
      : sparql`FILTER(${func}(${propertyVar}, ${valueLiteral}))`;

  return {
    patterns: [sparql`${subject} ${predicateNode} ${propertyVar} .`],
    filters: [filterExpr],
    optional: false,
  };
}
