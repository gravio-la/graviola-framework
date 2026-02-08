/**
 * Get entities and their classes based on type-safe filters
 *
 * This module provides a high-level function to query entities matching
 * a where clause and retrieve their rdf:type relationships.
 *
 * Used by useAnyOfFilterStore to determine which entities belong to which types.
 */

import type { DatasetCore } from "@rdfjs/types";
import type { Prefixes, SPARQLFlavour } from "@graviola/edb-core-types";
import { rdf } from "@tpluscode/rdf-ns-builders";
import { buildClassesWithFilterQuery } from "../schema2sparql/buildClassesQuery";

/**
 * Options for getting entities with classes
 */
export interface GetEntitiesWithClassesOptions {
  /** WHERE clause filters (Prisma-style) */
  where?: any;
  /** Prefix mappings for property names */
  prefixMap?: Prefixes;
  /** Default prefix for IRI resolution */
  defaultPrefix?: string;
  /** SPARQL flavour for optimization */
  flavour?: SPARQLFlavour;
}

/**
 * Get all entities matching a filter and their class IRIs
 *
 * This function:
 * 1. Builds a simplified CONSTRUCT query to get entities and their types
 * 2. Executes the query via constructFetch
 * 3. Extracts entity -> class mappings from the RDF dataset
 *
 * @param constructFetch - Function to execute CONSTRUCT queries
 * @param options - Filter and configuration options
 * @returns Map of entity IRI -> array of class IRIs
 *
 * @example
 * ```typescript
 * const entityClassMap = await getEntitiesWithClassesByFilter(
 *   constructFetch,
 *   {
 *     where: {
 *       geoFeature: { '@id': 'http://example.com/feature/1' }
 *     },
 *     prefixMap: { garden: 'http://ontology.semantic-desk.top/garden#' },
 *     defaultPrefix: 'http://example.com/'
 *   }
 * );
 *
 * // Returns: Map {
 * //   'http://example.com/patch/1' => ['http://...#Patch'],
 * //   'http://example.com/workshop/1' => ['http://...#Workshop']
 * // }
 * ```
 */
export async function getEntitiesWithClassesByFilter(
  constructFetch: (query: string) => Promise<DatasetCore>,
  options: GetEntitiesWithClassesOptions = {},
): Promise<Map<string, string[]>> {
  const { where, prefixMap = {}, defaultPrefix, flavour = "default" } = options;

  // Build query to get entities and their classes based on where filter
  const { query } = buildClassesWithFilterQuery({
    where,
    prefixMap,
    defaultPrefix,
    flavour,
  });

  // Execute CONSTRUCT query
  const dataset = await constructFetch(query);

  // Process dataset to build entity -> classes map
  const entityClassMap = new Map<string, string[]>();

  // Use dataset.match() to efficiently find all rdf:type triples
  // This is more efficient than iterating over all quads
  const typeTriples = dataset.match(null, rdf.type, null);

  for (const quad of typeTriples) {
    const entityIRI = quad.subject.value;
    const classIRI = quad.object.value;

    // Skip blank nodes
    if (quad.subject.termType === "BlankNode") {
      continue;
    }

    // Add class to entity's class list
    if (!entityClassMap.has(entityIRI)) {
      entityClassMap.set(entityIRI, []);
    }
    entityClassMap.get(entityIRI)!.push(classIRI);
  }

  return entityClassMap;
}
