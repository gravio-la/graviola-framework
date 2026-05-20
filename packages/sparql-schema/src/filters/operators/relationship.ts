/**
 * Relationship filter operators for SPARQL
 * Implements: some, every, none
 *
 * These operators allow filtering on array/relationship properties based on
 * whether related entities match certain criteria.
 */

import { sparql } from "@tpluscode/sparql-builder";
import df from "@rdfjs/data-model";
import type { FilterContext, FilterResult } from "../types";
import { convertIRIToNode } from "../../utils/iriConverter";
import { filterToSparql } from "../filterToSparql";

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

/** Match {@link ../../filters/operators/logical.ts} semantics for prefixed predicates. */
function createPredicateFromPropertyKey(
  propertyName: string,
  prefixMap: Record<string, string>,
) {
  const defaultPrefix = prefixMap[""] || "";
  if (defaultPrefix) {
    return convertIRIToNode(defaultPrefix + propertyName, prefixMap);
  }
  return df.namedNode(propertyName);
}

function sanitizePropertyVariableName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Build patterns for `{ field: filter, ... }` on a related RDF node (subject = `relatedVar`).
 * Mirrors {@link ../../filters/operators/logical.ts processMultiPropertyFilter} without importing logical
 * (would create a cyclic import graph with filterToSparql).
 */
function relatedEntityFieldPatterns(
  relatedVar: any,
  filterValue: Record<string, unknown>,
  baseContext: FilterContext,
): FilterResult {
  const result: FilterResult = {
    patterns: [],
    filters: [],
    optional: false,
  };
  const operatorKeys = new Set([
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
  ]);

  const keys = Object.keys(filterValue);
  if (keys.every((k) => operatorKeys.has(k))) {
    return filterToSparql(filterValue, {
      ...baseContext,
      subject: relatedVar,
    });
  }

  const prefixMapTyped = baseContext.prefixMap as Record<string, string>;
  const schemaProps =
    baseContext.schema &&
    typeof baseContext.schema === "object" &&
    baseContext.schema !== null &&
    "properties" in baseContext.schema
      ? (baseContext.schema.properties as Record<string, unknown>)
      : {};

  for (const [propertyName, propertyFilter] of Object.entries(filterValue)) {
    if (propertyName === "mode") continue;

    if (
      propertyName === "AND" ||
      propertyName === "OR" ||
      propertyName === "NOT"
    ) {
      const logicalResult = filterToSparql(
        { [propertyName]: propertyFilter },
        { ...baseContext, subject: relatedVar },
      );
      result.patterns.push(...logicalResult.patterns);
      result.filters.push(...logicalResult.filters);
      continue;
    }

    const propSchemaRaw = schemaProps[propertyName];
    const propSchemaType =
      typeof propSchemaRaw === "object" &&
      propSchemaRaw !== null &&
      "type" in propSchemaRaw
        ? ((propSchemaRaw as { type: string }).type as string | undefined)
        : undefined;

    const predicateNode = createPredicateFromPropertyKey(
      propertyName,
      prefixMapTyped,
    );
    const propertyVar = df.variable(sanitizePropertyVariableName(propertyName));

    const propertyContext: FilterContext = {
      ...baseContext,
      subject: relatedVar,
      property: propertyName,
      propertyVar,
      predicateNode,
      schemaType: propSchemaType,
      depth: baseContext.depth + 1,
    };

    const propResult = filterToSparql(propertyFilter, propertyContext);
    result.patterns.push(...propResult.patterns);
    result.filters.push(...propResult.filters);
    result.optional = result.optional || propResult.optional;
  }

  return result;
}

/**
 * some: At least one related entity matches the filter
 * This is the default behavior for relationship filtering.
 *
 * Examples:
 * { knows: { some: { '@id': 'http://example.com/friend1' } } }
 * => ?person :knows <http://example.com/friend1> .
 *
 * { knows: { some: { name: { contains: 'John' } } } }
 * => ?person :knows ?knows_rel_0 .
 *    ?knows_rel_0 :name ?name_1 .
 *    FILTER(CONTAINS(?name_1, "John"))
 *
 * @param filterValue - The filter criteria (can be node reference or nested filter)
 * @param context - Filter context with subject, predicate, etc.
 * @returns SPARQL patterns implementing the "some" logic
 */
export function applySomeOperator(
  filterValue: any,
  context: FilterContext,
): FilterResult {
  const { subject, predicateNode, prefixMap } = context;

  // Simple case: Direct node reference { '@id': '...' }
  if (isNodeReference(filterValue)) {
    const nodeValue = convertIRIToNode(filterValue["@id"], prefixMap);
    return {
      patterns: [sparql`${subject} ${predicateNode} ${nodeValue} .`],
      filters: [],
      optional: false,
    };
  }

  // Nested filter / field map on the related RDF node (?place :amenities ?rel . ?rel :amenityType "CAFE" .)
  const relatedVar = df.variable(`${context.property}_rel_${context.depth}`);
  const basePattern = sparql`${subject} ${predicateNode} ${relatedVar} .`;

  if (
    typeof filterValue === "object" &&
    filterValue !== null &&
    !Array.isArray(filterValue)
  ) {
    const nestedResult = relatedEntityFieldPatterns(
      relatedVar,
      filterValue as Record<string, unknown>,
      {
        ...context,
        schema: undefined,
      },
    );
    return {
      patterns: [basePattern, ...nestedResult.patterns],
      filters: [...nestedResult.filters],
      optional: nestedResult.optional,
    };
  }

  return {
    patterns: [basePattern],
    filters: [],
    optional: false,
  };
}

/**
 * every: All specified entities must be present in the relationship
 * This creates multiple triple patterns (implicit AND).
 *
 * Example:
 * { knows: { every: [{ '@id': 'http://ex.com/f1' }, { '@id': 'http://ex.com/f2' }] } }
 * => ?person :knows <http://ex.com/f1> .
 *    ?person :knows <http://ex.com/f2> .
 *
 * @param filterValues - Array of filter criteria (typically node references)
 * @param context - Filter context
 * @returns SPARQL patterns requiring all entities to be present
 */
export function applyEveryOperator(
  filterValues: any[],
  context: FilterContext,
): FilterResult {
  const { subject, predicateNode, prefixMap } = context;
  const patterns: any[] = [];

  // Ensure we have an array
  if (!Array.isArray(filterValues)) {
    throw new Error("'every' operator requires an array of filter criteria");
  }

  // For each filter value, create a triple pattern
  for (const filterValue of filterValues) {
    if (isNodeReference(filterValue)) {
      // Direct node reference
      const nodeValue = convertIRIToNode(filterValue["@id"], prefixMap);
      patterns.push(sparql`${subject} ${predicateNode} ${nodeValue} .`);
    } else {
      // For non-node references, we would need nested filtering
      // For now, throw an error as this is complex
      throw new Error(
        "'every' operator currently only supports node references with @id",
      );
    }
  }

  return {
    patterns,
    filters: [],
    optional: false,
  };
}

/**
 * none: No related entities match the filter
 * This uses FILTER NOT EXISTS to ensure the pattern doesn't match.
 *
 * Example:
 * { knows: { none: { '@id': 'http://example.com/blocked' } } }
 * => FILTER NOT EXISTS {
 *      ?person :knows <http://example.com/blocked> .
 *    }
 *
 * @param filterValue - The filter criteria to exclude
 * @param context - Filter context
 * @returns SPARQL patterns using NOT EXISTS
 */
export function applyNoneOperator(
  filterValue: any,
  context: FilterContext,
): FilterResult {
  const { subject, predicateNode, prefixMap } = context;

  // Simple case: Direct node reference { '@id': '...' }
  if (isNodeReference(filterValue)) {
    const nodeValue = convertIRIToNode(filterValue["@id"], prefixMap);
    const innerPattern = sparql`${subject} ${predicateNode} ${nodeValue} .`;

    return {
      patterns: [sparql`FILTER NOT EXISTS { ${innerPattern} }`],
      filters: [],
      optional: false,
    };
  }

  // Complex case: Could be array of node references
  if (Array.isArray(filterValue)) {
    const innerPatterns: any[] = [];
    for (const val of filterValue) {
      if (isNodeReference(val)) {
        const nodeValue = convertIRIToNode(val["@id"], prefixMap);
        innerPatterns.push(sparql`${subject} ${predicateNode} ${nodeValue} .`);
      }
    }

    // Combine all patterns with UNION for "none of these"
    if (innerPatterns.length > 0) {
      // For multiple exclusions, we need separate FILTER NOT EXISTS for each
      // or a single one with a VALUES clause
      const relatedVar = df.variable(
        `${context.property}_none_${context.depth}`,
      );
      const nodes = filterValue
        .filter(isNodeReference)
        .map((v) => convertIRIToNode(v["@id"], prefixMap));

      if (nodes.length > 0) {
        const valuesPattern = sparql`VALUES ${relatedVar} { ${nodes} }`;
        const triplePattern = sparql`${subject} ${predicateNode} ${relatedVar} .`;
        return {
          patterns: [
            sparql`FILTER NOT EXISTS { ${valuesPattern} ${triplePattern} }`,
          ],
          filters: [],
          optional: false,
        };
      }
    }
  }

  // For complex nested filters, create a variable and use NOT EXISTS
  const relatedVar = df.variable(`${context.property}_none_${context.depth}`);
  const basePattern = sparql`${subject} ${predicateNode} ${relatedVar} .`;

  return {
    patterns: [sparql`FILTER NOT EXISTS { ${basePattern} }`],
    filters: [],
    optional: false,
  };
}

/**
 * Dispatch to appropriate relationship operator
 */
export function applyRelationshipOperator(
  operator: "some" | "every" | "none",
  value: any,
  context: FilterContext,
): FilterResult {
  switch (operator) {
    case "some":
      return applySomeOperator(value, context);
    case "every":
      return applyEveryOperator(value, context);
    case "none":
      return applyNoneOperator(value, context);
  }
}
