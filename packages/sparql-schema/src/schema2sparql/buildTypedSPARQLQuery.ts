/**
 * Type-safe SPARQL query builder with filter validation
 *
 * This module provides a high-level API for building SPARQL CONSTRUCT queries
 * with full TypeScript type safety and optional runtime validation.
 *
 * Features:
 * - Type-safe WHERE filters (Prisma-style)
 * - Type-safe include patterns with pagination
 * - Runtime filter validation using ajv
 * - Support for Zod schema inference
 * - Complex nested filters and includes
 */

import type { JSONSchema7 } from "json-schema";
import type {
  Prefixes,
  FilterValidationMode,
  SPARQLFlavour,
} from "@graviola/edb-core-types";
import { normalizeSchema } from "@graviola/edb-graph-traversal";
import { normalizedSchema2construct } from "./normalizedSchema2construct";
import { buildSPARQLConstructQuery } from "./buildSPARQLConstructQuery";
import type { ConstructResult } from "./normalizedSchema2construct";
import { TypedGraphTraversalFilterOptions } from "@graviola/edb-core-types";

/**
 * Options for building typed SPARQL queries
 *
 * @template T - The type to derive filter patterns from (typically z.infer<typeof schema>)
 */
export interface BuildTypedSPARQLQueryOptions<T = any>
  extends TypedGraphTraversalFilterOptions<T> {
  /** Prefix mappings for the query (e.g., { "foaf": "http://xmlns.com/foaf/0.1/" }) */
  prefixMap?: Prefixes;
  /** Maximum recursion depth for nested objects (default: 4) */
  maxRecursion?: number;
  /** Properties to explicitly exclude from the query */
  excludedProperties?: string[];
  /** Runtime validation mode for filters (from core-types) */
  filterValidationMode?: FilterValidationMode;
  /** SPARQL flavour for optimization (e.g., 'oxigraph' uses BIND for single subjects) */
  flavour?: SPARQLFlavour;
}

/**
 * Result of typed SPARQL query building
 */
export interface TypedSPARQLQueryResult {
  /** The complete SPARQL CONSTRUCT query string */
  query: string;
  /** Raw CONSTRUCT and WHERE patterns */
  constructResult: ConstructResult;
  /** The normalized schema used */
  normalizedSchema: any;
}

/**
 * Build a type-safe SPARQL CONSTRUCT query with optional filter validation
 *
 * This is the main entry point for building SPARQL queries with full type safety.
 * It combines schema normalization, filter validation, and query generation.
 * Supports both single and multiple subject IRIs for batch queries.
 *
 * @template T - The type to derive filters from (typically z.infer<typeof zodSchema>)
 * @param subjectIRI - The IRI(s) of the subject(s) to query (single IRI or array)
 * @param schema - JSON Schema for the data structure
 * @param options - Type-safe filter options (select, include, where, etc.)
 * @returns Complete SPARQL query with metadata
 *
 * @throws {Error} If filterValidationMode is 'throw' and filters are invalid
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { buildTypedSPARQLQuery } from '@graviola/sparql-schema';
 *
 * const PersonSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   email: z.string(),
 *   friends: z.array(z.object({
 *     name: z.string(),
 *     age: z.number()
 *   }))
 * });
 *
 * type Person = z.infer<typeof PersonSchema>;
 *
 * // Single subject
 * const result1 = buildTypedSPARQLQuery<Person>(
 *   'http://example.com/person/1',
 *   PersonSchema.schema, // JSON Schema from Zod
 *   {
 *     select: { name: true, age: true },
 *     include: {
 *       friends: { take: 10, orderBy: { name: 'asc' } }
 *     },
 *     where: {
 *       age: { gte: 18 },
 *       email: { endsWith: '@example.com' }
 *     },
 *     filterValidationMode: 'throw',
 *     prefixMap: { '': 'http://example.com/' },
 *     flavour: 'oxigraph'
 *   }
 * );
 *
 * // Multiple subjects (batch query)
 * const result2 = buildTypedSPARQLQuery<Person>(
 *   ['http://example.com/person/1', 'http://example.com/person/2'],
 *   PersonSchema.schema,
 *   {
 *     select: { name: true, age: true },
 *     flavour: 'default' // Uses VALUES for multiple subjects
 *   }
 * );
 *
 * console.log(result1.query); // Complete SPARQL query
 * ```
 */
export function buildTypedSPARQLQuery<T = any>(
  subjectIRI: string | string[],
  schema: JSONSchema7,
  options: BuildTypedSPARQLQueryOptions<T> = {},
): TypedSPARQLQueryResult {
  const {
    prefixMap = {},
    maxRecursion = 4,
    excludedProperties = [],
    filterValidationMode,
    flavour,
    ...filterOptions
  } = options;

  // This applies select, include, omit, and validates WHERE filters
  const normalizedSchema = normalizeSchema(schema, {
    ...filterOptions,
    filterValidationMode,
  });

  // Pass filter options through context for nested query construction
  // Now supports single or multiple subject IRIs
  const constructResult = normalizedSchema2construct(
    subjectIRI,
    normalizedSchema,
    {
      prefixMap,
      maxRecursion,
      excludedProperties,
      filterOptions,
      flavour,
    },
  );

  const query = buildSPARQLConstructQuery(constructResult, prefixMap);

  return {
    query,
    constructResult,
    normalizedSchema,
  };
}

/**
 * Build a type-safe SPARQL CONSTRUCT query for multiple subjects
 * Useful for batch queries
 *
 * @template T - The type to derive filters from
 * @param subjectIRIs - Array of subject IRIs to query
 * @param schema - JSON Schema for the data structure
 * @param options - Type-safe filter options
 * @returns SPARQL query that fetches all subjects
 *
 * @example
 * ```typescript
 * const result = buildTypedSPARQLQueryBatch<Person>(
 *   [
 *     'http://example.com/person/1',
 *     'http://example.com/person/2',
 *     'http://example.com/person/3'
 *   ],
 *   personSchema,
 *   {
 *     where: { age: { gte: 18 } },
 *     include: { friends: { take: 5 } }
 *   }
 * );
 * ```
 */
export function buildTypedSPARQLQueryBatch<T = any>(
  subjectIRIs: string[],
  schema: JSONSchema7,
  options: BuildTypedSPARQLQueryOptions<T> = {},
): TypedSPARQLQueryResult {
  if (subjectIRIs.length === 0) {
    throw new Error("At least one subject IRI is required");
  }

  const {
    prefixMap = {},
    maxRecursion = 4,
    excludedProperties = [],
    filterValidationMode,
    flavour,
    ...filterOptions
  } = options;

  // This applies select, include, omit, and validates WHERE filters
  const normalizedSchema = normalizeSchema(schema, {
    ...filterOptions,
    filterValidationMode,
  });

  // Pass array of subject IRIs - normalizedSchema2construct now handles multiple subjects
  const constructResult = normalizedSchema2construct(
    subjectIRIs,
    normalizedSchema,
    {
      prefixMap,
      maxRecursion,
      excludedProperties,
      filterOptions,
      flavour,
    },
  );

  const query = buildSPARQLConstructQuery(constructResult, prefixMap);

  return {
    query,
    constructResult,
    normalizedSchema,
  };
}
