/**
 * Simplified SPARQL query builder for getting entity classes with filters
 *
 * This is a lightweight alternative to normalizedSchema2construct specifically
 * designed for the useAnyOfFilterStore use case where we only need to:
 * 1. Find entities matching a where clause
 * 2. Get their rdf:type triples
 *
 * Unlike the full construct builder, this does NOT traverse nested properties.
 */

import {
  sparql,
  SparqlTemplateResult,
  CONSTRUCT,
} from "@tpluscode/sparql-builder";
import { rdf } from "@tpluscode/rdf-ns-builders";
import type { Prefixes, SPARQLFlavour } from "@graviola/edb-core-types";
import df from "@rdfjs/data-model";
import { filterToSparql } from "@/filters/filterToSparql";
import type { FilterContext } from "@/filters/types";
import { convertIRIToNode } from "@/utils";
import { prefixes2sparqlPrefixDeclaration } from "./prefixes2sparqlPrefixDeclaration";

/**
 * Options for building classes query with filters
 */
export interface BuildClassesQueryOptions {
  /** WHERE clause filters (Prisma-style) */
  where?: any;
  /** Prefix mappings for property names */
  prefixMap?: Prefixes;
  /** SPARQL flavour for optimization */
  flavour?: SPARQLFlavour;

  defaultPrefix?: string;
}

/**
 * Result of classes query generation
 */
export interface ClassesQueryResult {
  /** The complete SPARQL CONSTRUCT query string */
  query: string;
}

/**
 * Build a SPARQL CONSTRUCT query to get entities and their classes based on filters
 *
 * This generates a minimal query that:
 * - Finds all entities matching the where clause
 * - Constructs their rdf:type triples
 * - Does NOT traverse nested properties (unlike normalizedSchema2construct)
 *
 * @param options - Filter and configuration options
 * @returns Complete SPARQL query
 *
 * @example
 * ```typescript
 * const result = buildClassesWithFilterQuery({
 *   where: {
 *     geoFeature: { '@id': 'http://example.com/feature/1' }
 *   },
 *   prefixMap: { garden: 'http://ontology.semantic-desk.top/garden#' }
 * });
 *
 * // Execute query and process results
 * const dataset = await constructFetch(result.query);
 * ```
 */
export function buildClassesWithFilterQuery(
  options: BuildClassesQueryOptions = {},
): ClassesQueryResult {
  const { where, prefixMap = {}, flavour = "default", defaultPrefix } = options;

  const finalPrefixMap = defaultPrefix
    ? { "": defaultPrefix, ...prefixMap }
    : prefixMap;

  const constructPatterns: SparqlTemplateResult[] = [];
  const wherePatterns: SparqlTemplateResult[] = [];

  // Create subject variable for entities we're looking for
  const subjectVar = df.variable("entity");
  const typeVar = df.variable("class");

  // Core pattern: entity has a type
  const typePattern = sparql`${subjectVar} ${rdf.type} ${typeVar} .`;
  constructPatterns.push(typePattern);
  wherePatterns.push(typePattern);

  // Apply WHERE filters if provided
  if (where && typeof where === "object") {
    for (const [propertyName, propertyFilter] of Object.entries(where)) {
      if (propertyFilter === undefined || propertyFilter === null) {
        continue;
      }

      // Create predicate and variable for this property
      const predicate = convertIRIToNode(propertyName, prefixMap);
      const propVarName = sanitizeVariableName(propertyName);
      const propVar = df.variable(propVarName);

      // Create filter context for this property
      const filterContext: FilterContext = {
        subject: subjectVar,
        property: propertyName,
        propertyVar: propVar,
        predicateNode: predicate,
        schemaType: undefined, // We don't have schema information here
        prefixMap,
        flavour,
        depth: 0,
        schema: undefined,
      };

      // Convert filter to SPARQL patterns
      const filterResult = filterToSparql(propertyFilter, filterContext);

      // Add basic triple pattern (entity -> property -> value)
      const triplePattern = sparql`${subjectVar} ${predicate} ${propVar} .`;
      wherePatterns.push(triplePattern);

      // Add filter patterns and filter expressions
      wherePatterns.push(...filterResult.patterns);
      wherePatterns.push(...filterResult.filters);
    }
  }

  // Build the CONSTRUCT query
  let query = CONSTRUCT`${constructPatterns}`.WHERE`${wherePatterns}`;

  // Add PREFIX declarations
  if (finalPrefixMap && Object.keys(finalPrefixMap).length > 0) {
    const prefixDecls = prefixes2sparqlPrefixDeclaration(finalPrefixMap);
    if (prefixDecls) {
      query = query.prologue`${prefixDecls}`;
    }
  }

  return {
    query: query.build().toString(),
  };
}

/**
 * Sanitize variable name to be valid in SPARQL
 * Only allow alphanumeric and underscore
 */
function sanitizeVariableName(name: string): string {
  // Remove any characters that aren't alphanumeric or underscore
  // Replace colons and other special chars with underscore
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}
