/**
 * Type-safe document filtering and loading with Prisma-style API
 *
 * This module provides high-level functions that combine:
 * - buildTypedSPARQLQuery for type-safe query generation
 * - SPARQL execution via constructFetch
 * - Data extraction via traverseGraphExtractBySchema
 *
 * Features:
 * - Single and batch entity loading by IRI
 * - Finding entities by type with filters
 * - Full TypeScript type safety
 * - Prisma-style where/include/select API
 */

import type { JSONSchema7 } from "json-schema";
import type { DatasetCore } from "@rdfjs/types";
import type { Dataset } from "@rdfjs/types";
import type {
  WalkerOptions,
  Entity,
  SparqlBuildOptions,
} from "@graviola/edb-core-types";
import { traverseGraphExtractBySchema } from "@graviola/edb-graph-traversal";
import { buildTypedSPARQLQuery } from "../schema2sparql/buildTypedSPARQLQuery";
import type { BuildTypedSPARQLQueryOptions } from "../schema2sparql/buildTypedSPARQLQuery";
import { findEntityByClass } from "../find/findEntityByClass";
import type { FindEntityByClassOptions } from "../find/findEntityByClass";

/**
 * Options for filterTypedDocument
 * Extends BuildTypedSPARQLQueryOptions with CRUD-specific options
 */
export interface TypedFilterOptions<T = any>
  extends BuildTypedSPARQLQueryOptions<T> {
  /** Walker options for graph traversal */
  walkerOptions?: Partial<WalkerOptions>;
  /** Default prefix for IRI resolution */
  defaultPrefix?: string;
  /** Query build options for SPARQL generation */
  queryBuildOptions?: SparqlBuildOptions;
}

/**
 * Options for filterTypedDocuments (finding multiple entities)
 * Adds search and limit capabilities
 */
export interface TypedFilterAndSearchOptions<T = any>
  extends TypedFilterOptions<T> {
  /** Search string to filter entities */
  searchString?: string | null;
  /** Maximum number of entities to return */
  limit?: number;
}

/**
 * Load a single entity or batch of entities by IRI with type-safe filters
 *
 * This function combines:
 * 1. buildTypedSPARQLQuery - generates type-safe SPARQL CONSTRUCT query
 * 2. constructFetch - executes the query
 * 3. traverseGraphExtractBySchema - extracts structured data from RDF graph
 *
 * @template T - The type to derive filters from (typically z.infer<typeof schema>)
 * @param entityIRI - Single IRI or array of IRIs to load
 * @param typeIRI - Type IRI of the entity/entities
 * @param schema - JSON Schema (should already have correct definition at top via bringDefinitionToTop)
 * @param constructFetch - Function to execute CONSTRUCT queries
 * @param options - Type-safe filter options (select, include, where, etc.)
 * @returns Single document or array of documents matching type T
 *
 * @example
 * ```typescript
 * // Single entity
 * const person = await filterTypedDocument<Person>(
 *   'http://example.com/person/1',
 *   'http://example.com/Person',
 *   personSchema,
 *   constructFetch,
 *   {
 *     select: { name: true, age: true },
 *     include: { friends: { take: 10 } },
 *     where: { age: { gte: 18 } },
 *     defaultPrefix: 'http://example.com/'
 *   }
 * );
 *
 * // Batch loading
 * const people = await filterTypedDocument<Person>(
 *   ['http://example.com/person/1', 'http://example.com/person/2'],
 *   'http://example.com/Person',
 *   personSchema,
 *   constructFetch,
 *   { select: { name: true } }
 * );
 * ```
 */
export async function filterTypedDocument<T = any>(
  entityIRI: string | string[],
  typeIRI: string,
  schema: JSONSchema7,
  constructFetch: (query: string) => Promise<DatasetCore>,
  options: TypedFilterOptions<T> = {},
): Promise<T | T[]> {
  const {
    walkerOptions,
    defaultPrefix = "",
    prefixMap = {},
    ...buildOptions
  } = options;

  // Build prefix map from defaultPrefix if not provided
  const finalPrefixMap =
    Object.keys(prefixMap).length > 0
      ? prefixMap
      : defaultPrefix
        ? { "": defaultPrefix }
        : {};

  // Step 1: Build type-safe SPARQL query
  const { query } = buildTypedSPARQLQuery<T>(entityIRI, schema, {
    ...buildOptions,
    prefixMap: finalPrefixMap,
  });

  // Step 2: Execute CONSTRUCT query
  const dataset = await constructFetch(query);

  // Step 3: Extract data from graph
  const isBatch = Array.isArray(entityIRI);

  if (isBatch) {
    // Batch extraction
    const results = await Promise.all(
      entityIRI.map((iri) =>
        traverseGraphExtractBySchema(
          defaultPrefix,
          iri,
          dataset as Dataset,
          schema,
          walkerOptions,
        ),
      ),
    );
    return results as T[];
  } else {
    // Single entity extraction
    const result = traverseGraphExtractBySchema(
      defaultPrefix,
      entityIRI as string,
      dataset as Dataset,
      schema,
      walkerOptions,
    );
    return result as T;
  }
}

/**
 * Find multiple entities by type with type-safe filters
 *
 * This function:
 * 1. Uses findEntityByClass to discover entities of the given type
 * 2. Optionally filters by search string
 * 3. Loads each entity with filterTypedDocument and full filter options
 *
 * @template T - The type to derive filters from
 * @param typeIRI - Type IRI to search for
 * @param schema - JSON Schema (should already have correct definition at top)
 * @param selectFetch - Function to execute SELECT queries (for finding entities)
 * @param constructFetch - Function to execute CONSTRUCT queries (for loading entities)
 * @param options - Type-safe filter and search options
 * @returns Array of documents matching type T
 *
 * @example
 * ```typescript
 * const adults = await filterTypedDocuments<Person>(
 *   'http://example.com/Person',
 *   personSchema,
 *   selectFetch,
 *   constructFetch,
 *   {
 *     where: { age: { gte: 18 } },
 *     include: { friends: { take: 5 } },
 *     searchString: 'john',
 *     limit: 50,
 *     defaultPrefix: 'http://example.com/',
 *     queryBuildOptions: { ... }
 *   }
 * );
 * ```
 */
export async function filterTypedDocuments<T = any>(
  typeIRI: string,
  schema: JSONSchema7,
  selectFetch: (query: string) => Promise<any>,
  constructFetch: (query: string) => Promise<DatasetCore>,
  options: TypedFilterAndSearchOptions<T> = {},
): Promise<T[]> {
  const {
    searchString = null,
    limit,
    defaultPrefix = "",
    walkerOptions,
    ...filterOptions
  } = options;

  // Build findEntityByClass options from TypedFilterOptions
  const findOptions: FindEntityByClassOptions = {
    defaultPrefix,
    queryBuildOptions: (options as any).queryBuildOptions || {
      propertyToIRI: (prop: string) => `${defaultPrefix}${prop}`,
      typeIRItoTypeName: (iri: string) => iri.replace(defaultPrefix, ""),
      primaryFields: {},
      primaryFieldExtracts: {},
    },
  };

  // Step 1: Find entities by class (and optional search string)
  const entities: Entity[] = await findEntityByClass(
    searchString,
    typeIRI,
    selectFetch,
    findOptions,
    limit,
  );

  // Step 2: Extract just the IRIs
  const entityIRIs = entities.map((entity) => entity.entityIRI);

  if (entityIRIs.length === 0) {
    return [];
  }

  // Step 3: Load all entities with filters using batch loading
  // This is more efficient than loading one by one
  const documents = await filterTypedDocument<T>(
    entityIRIs,
    typeIRI,
    schema,
    constructFetch,
    {
      ...filterOptions,
      defaultPrefix,
      walkerOptions,
    },
  );

  // Ensure we return an array
  return Array.isArray(documents) ? documents : [documents];
}
