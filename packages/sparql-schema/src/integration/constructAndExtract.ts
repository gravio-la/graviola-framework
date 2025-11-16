/**
 * High-level integration API combining normalizer → query builder → extractor
 *
 * This module provides a convenient API that:
 * 1. Normalizes schema with filters
 * 2. Builds safe SPARQL CONSTRUCT query
 * 3. Executes query against SPARQL endpoint
 * 4. Extracts structured data from resulting dataset
 *
 * Key feature: Pagination applied at query stage is marked with source: "query"
 * so the extractor knows not to paginate again (prevents double-pagination).
 */

import { JSONSchema7 } from "json-schema";
import type {
  GraphTraversalFilterOptions,
  PaginationMetadata,
  Prefixes,
} from "@graviola/edb-core-types";
import {
  normalizeSchema,
  extractFromGraph,
  type Logger,
} from "@graviola/edb-graph-traversal";
import type { DatasetCore } from "@rdfjs/types";

import { normalizedSchema2construct } from "../schema2sparql/normalizedSchema2construct";

/**
 * SPARQL client interface for executing CONSTRUCT queries
 */
export interface SparqlClient {
  /**
   * Execute a CONSTRUCT query and return the resulting RDF dataset
   */
  construct(
    constructPatterns: any[],
    wherePatterns: any[],
  ): Promise<DatasetCore>;
}

/**
 * Options for constructAndExtract
 */
export interface ConstructAndExtractOptions {
  /** Filter options (select, include, omit, pagination) */
  filterOptions?: GraphTraversalFilterOptions;
  /** Base IRI for resolving relative IRIs */
  baseIRI?: string;
  /** Prefix mappings for property names (e.g., { "foaf": "http://xmlns.com/foaf/0.1/" }) */
  prefixMap?: Prefixes;
  /** Logger for debugging */
  logger?: Logger;
  /** Properties to exclude from CONSTRUCT query */
  excludedProperties?: string[];
  /** Maximum recursion depth for nested objects */
  maxRecursion?: number;
}

/**
 * High-level API: Build CONSTRUCT query → Execute → Extract data
 *
 * This function orchestrates the complete pipeline:
 * - Schema normalization with filters
 * - Safe SPARQL CONSTRUCT query generation
 * - Query execution via SPARQL client
 * - Data extraction from resulting dataset
 * - Pagination metadata flow (prevents double-pagination)
 *
 * @param iri - IRI of the entity to retrieve
 * @param schema - JSON Schema defining the entity structure
 * @param sparqlClient - Client for executing SPARQL queries
 * @param options - Configuration options
 * @returns Extracted entity data
 *
 * @example
 * ```typescript
 * const person = await constructAndExtract(
 *   "http://example.com/person1",
 *   personSchema,
 *   mySparqlClient,
 *   {
 *     filterOptions: {
 *       include: { friends: { take: 10 } }, // Pagination
 *     },
 *     baseIRI: "http://schema.org/",
 *   }
 * );
 * // person.friends will have exactly 10 items (no double-pagination!)
 * ```
 */
export async function constructAndExtract(
  iri: string,
  schema: JSONSchema7,
  sparqlClient: SparqlClient,
  options: ConstructAndExtractOptions = {},
): Promise<any> {
  const {
    filterOptions = {},
    baseIRI = "http://schema.org/",
    prefixMap,
    logger,
    excludedProperties,
    maxRecursion,
  } = options;

  // Step 1: Normalize schema with filters applied
  // This resolves all $refs and applies select/include/omit patterns
  const normalizedSchema = normalizeSchema(schema, filterOptions);

  // Step 2: Build safe SPARQL CONSTRUCT query
  // Uses @tpluscode/sparql-builder for injection safety
  const { constructPatterns, wherePatterns, paginationMetadata } =
    normalizedSchema2construct(iri, normalizedSchema, {
      excludedProperties,
      maxRecursion,
      prefixMap,
    });

  // Step 3: Execute CONSTRUCT query via client
  const dataset = await sparqlClient.construct(
    constructPatterns,
    wherePatterns,
  );

  // Step 4: Attach pagination metadata to normalized schema
  // This ensures the extractor knows which arrays were paginated at query time
  attachPaginationMetadata(normalizedSchema, paginationMetadata);

  // Step 5: Extract structured data from dataset
  // The extractor will see source: "query" on pagination metadata
  // and skip re-paginating those arrays (prevents double-pagination!)
  return extractFromGraph(
    iri,
    dataset,
    normalizedSchema,
    filterOptions,
    baseIRI,
    prefixMap, // Note: extractor also uses prefix map for property name expansion
    logger,
  );
}

/**
 * Attach pagination metadata to normalized schema
 *
 * This marks array properties with x-pagination metadata, including
 * source: "query" to indicate pagination was applied at query stage.
 * The extractor will see this and skip re-pagination.
 *
 * @param normalizedSchema - Normalized schema to modify
 * @param paginationMetadata - Map of property name → pagination info
 */
function attachPaginationMetadata(
  normalizedSchema: any,
  paginationMetadata: Map<string, PaginationMetadata>,
): void {
  if (!normalizedSchema.properties) {
    return;
  }

  // Walk through properties and attach pagination metadata
  for (const [propertyName, pagMeta] of paginationMetadata.entries()) {
    const property = normalizedSchema.properties[propertyName];

    if (property && typeof property === "object") {
      // Attach as x-pagination (extractor looks for this)
      (property as any)["x-pagination"] = pagMeta;
    }
  }
}

/**
 * Batch version: Retrieve multiple entities with same schema
 *
 * Optimized for retrieving many entities:
 * - Schema normalized only once (cached!)
 * - Queries built in parallel
 * - Extractions run in parallel
 *
 * @param iris - Array of entity IRIs to retrieve
 * @param schema - JSON Schema (same for all entities)
 * @param sparqlClient - Client for executing SPARQL queries
 * @param options - Configuration options
 * @returns Array of extracted entities (same order as iris)
 *
 * @example
 * ```typescript
 * const people = await constructAndExtractBatch(
 *   [
 *     "http://example.com/person1",
 *     "http://example.com/person2",
 *     "http://example.com/person3",
 *   ],
 *   personSchema,
 *   mySparqlClient,
 *   { filterOptions: { include: { friends: { take: 10 } } } }
 * );
 * // Much faster than individual calls!
 * ```
 */
export async function constructAndExtractBatch(
  iris: string[],
  schema: JSONSchema7,
  sparqlClient: SparqlClient,
  options: ConstructAndExtractOptions = {},
): Promise<any[]> {
  const {
    filterOptions = {},
    baseIRI = "http://schema.org/",
    prefixMap,
    logger,
    excludedProperties,
    maxRecursion,
  } = options;

  // Optimize: Normalize schema only once!
  const normalizedSchema = normalizeSchema(schema, filterOptions);

  // Build queries for all IRIs (fast - just pattern building)
  const queries = iris.map((iri) =>
    normalizedSchema2construct(iri, normalizedSchema, {
      excludedProperties,
      maxRecursion,
      prefixMap,
    }),
  );

  // Execute all queries in parallel
  const datasets = await Promise.all(
    queries.map(({ constructPatterns, wherePatterns }) =>
      sparqlClient.construct(constructPatterns, wherePatterns),
    ),
  );

  // Extract data from all datasets in parallel
  const results = await Promise.all(
    datasets.map((dataset, index) => {
      const iri = iris[index];
      const { paginationMetadata } = queries[index];

      // Clone normalized schema for this entity (avoid mutation)
      const schemaClone = JSON.parse(JSON.stringify(normalizedSchema));
      attachPaginationMetadata(schemaClone, paginationMetadata);

      return extractFromGraph(
        iri,
        dataset,
        schemaClone,
        filterOptions,
        baseIRI,
        prefixMap,
        logger,
      );
    }),
  );

  return results;
}
