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
import { OptionalStringOrStringArray } from "@/base";
import { TypedGraphTraversalFilterOptions } from "@graviola/edb-core-types";
import { z } from "zod";

/**
 * Options for building typed SPARQL queries
 *
 * @template T - The type to derive filter patterns from (typically z.infer<typeof schema>)
 */
export interface BuildTypedSPARQLQueryOptions<
  T = any,
> extends TypedGraphTraversalFilterOptions<T> {
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
 * @param typeIRIs - The type IRI(s) for the entities (can be undefined)
 * @param schema - Zod schema or JSON Schema for the data structure
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
 *   '@id': z.string().optional(),
 *   '@type': z.literal('http://example.com/Person'),
 *   name: z.string(),
 *   age: z.number(),
 *   email: z.string(),
 *   friends: z.array(z.object({
 *     '@id': z.string().optional(),
 *     name: z.string(),
 *     age: z.number()
 *   }))
 * });
 *
 * type Person = z.infer<typeof PersonSchema>;
 *
 * // Pass Zod schema directly - conversion happens automatically!
 * const result = buildTypedSPARQLQuery<Person>(
 *   'http://example.com/person/1',
 *   'http://example.com/Person', // Type IRI
 *   PersonSchema, // Zod schema - auto-converted to JSON Schema
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
 * console.log(result.query); // Complete SPARQL query
 * ```
 */
export function buildTypedSPARQLQuery<T = any>(
  subjectIRI: OptionalStringOrStringArray,
  typeIRIs: OptionalStringOrStringArray | undefined,
  schema: z.ZodType<T> | JSONSchema7,
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

  // Convert Zod schema to JSON Schema if needed
  // Check if it's a Zod schema by checking for _def property
  let jsonSchema: JSONSchema7;
  if (schema && typeof schema === "object" && "_def" in schema) {
    // Zod schema - convert to JSON Schema
    jsonSchema = z.toJSONSchema(schema as z.ZodType<T>, {
      target: "draft-7",
      reused: "ref",
    }) as JSONSchema7;
  } else {
    // Already JSON Schema
    jsonSchema = schema as JSONSchema7;
  }

  // This applies select, include, omit, and validates WHERE filters
  const normalizedSchema = normalizeSchema(jsonSchema, {
    ...filterOptions,
    filterValidationMode,
  });

  // Pass filter options through context for nested query construction
  // Now supports single or multiple subject IRIs
  const constructResult = normalizedSchema2construct(
    subjectIRI,
    typeIRIs,
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
