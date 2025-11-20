/**
 * Utilities for casting SPARQL variables to specific datatypes
 *
 * Based on SPARQL 1.1 casting rules:
 * - Y = always allowed
 * - M = depends on lexical value (may fail at runtime)
 * - N = never allowed
 */

import { sparql, type SparqlTemplateResult } from "@tpluscode/sparql-builder";
import type { NamedNode } from "@rdfjs/types";
import { xsd } from "@tpluscode/rdf-ns-builders";

/**
 * Cast a SPARQL variable to a specific XSD datatype
 *
 * This ensures type safety for comparisons and operations.
 * The cast will fail at query execution time if the value cannot be converted
 * to the target type (e.g., casting "abc" to xsd:integer).
 *
 * @param variable - The SPARQL variable to cast (e.g., ?age)
 * @param targetType - The target XSD datatype (e.g., xsd.integer, xsd.decimal)
 * @returns SPARQL expression that casts the variable to the target type
 *
 * @example
 * // Cast to integer for numeric comparison
 * const castVar = castVariable(propertyVar, xsd.integer);
 * // Results in: xsd:integer(?age)
 *
 * @example
 * // Use in filter
 * filters: [sparql`FILTER(${castVariable(propertyVar, xsd.integer)} >= 18)`]
 */
export function castVariable(
  variable: SparqlTemplateResult | any,
  targetType: NamedNode,
): SparqlTemplateResult {
  // Use XSD constructor function: xsd:datatype(?var)
  // This is the functional form defined in SPARQL 1.1
  // The sparql-builder library will serialize the NamedNode with proper prefixes
  return sparql`${targetType}(${variable})` as SparqlTemplateResult;
}

/**
 * Cast a variable to xsd:integer
 * Convenience function for common integer casting
 */
export function castToInteger(
  variable: SparqlTemplateResult | any,
): SparqlTemplateResult {
  return castVariable(variable, xsd.integer);
}

/**
 * Cast a variable to xsd:decimal
 * Convenience function for common decimal casting
 */
export function castToDecimal(
  variable: SparqlTemplateResult | any,
): SparqlTemplateResult {
  return castVariable(variable, xsd.decimal);
}

/**
 * Cast a variable to xsd:double
 * Convenience function for floating-point casting
 */
export function castToDouble(
  variable: SparqlTemplateResult | any,
): SparqlTemplateResult {
  return castVariable(variable, xsd.double);
}

/**
 * Cast a variable to xsd:float
 * Convenience function for single-precision floating-point casting
 */
export function castToFloat(
  variable: SparqlTemplateResult | any,
): SparqlTemplateResult {
  return castVariable(variable, xsd.float);
}

/**
 * Cast a variable to xsd:boolean
 * Convenience function for boolean casting
 */
export function castToBoolean(
  variable: SparqlTemplateResult | any,
): SparqlTemplateResult {
  return castVariable(variable, xsd.boolean);
}

/**
 * Cast a variable to xsd:dateTime
 * Convenience function for dateTime casting
 */
export function castToDateTime(
  variable: SparqlTemplateResult | any,
): SparqlTemplateResult {
  return castVariable(variable, xsd.dateTime);
}

/**
 * Cast a variable to xsd:string
 * Convenience function for string casting
 */
export function castToString(
  variable: SparqlTemplateResult | any,
): SparqlTemplateResult {
  return castVariable(variable, xsd.string);
}
