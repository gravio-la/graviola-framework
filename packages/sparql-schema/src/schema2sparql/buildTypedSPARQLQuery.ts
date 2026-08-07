/**
 * Filterable SPARQL query builder with filter validation
 *
 * This module provides a high-level API for building SPARQL CONSTRUCT queries
 * with full TypeScript type safety for filter options and optional runtime validation.
 *
 * Features:
 * - Type-safe WHERE filters (Prisma-style)
 * - Type-safe include patterns with pagination
 * - Runtime filter validation using ajv
 * - Complex nested filters and includes
 *
 * Pass a JSON Schema for the entity shape (same artifact as the rest of Graviola).
 */

import type { JSONSchema7 } from "json-schema";
import type {
  Prefixes,
  FilterValidationMode,
  SPARQLFlavour,
  SparqlFeatureFlags,
} from "@graviola/edb-core-types";
import {
  buildTraversalSchema,
  resolveEffectiveMaxRecursion,
} from "@graviola/edb-graph-traversal";
import { traversalSchema2construct } from "./traversalSchema2construct";
import { buildSPARQLConstructQuery } from "./buildSPARQLConstructQuery";
import type { ConstructResult } from "./traversalSchema2construct";
import { OptionalStringOrStringArray } from "@/base";
import { TypedGraphTraversalFilterOptions } from "@graviola/edb-core-types";

/**
 * Options for building filterable SPARQL queries
 *
 * @template T - Document shape used to type filter option bags (caller-supplied)
 */
export interface BuildFilterableSPARQLQueryOptions<
  T = any,
> extends TypedGraphTraversalFilterOptions<T> {
  /** Prefix mappings for the query (e.g., { "foaf": "http://xmlns.com/foaf/0.1/" }) */
  prefixMap?: Prefixes;
  /**
   * Maximum recursion depth for nested objects.
   * When omitted and an `include` tree is present, depth is derived from the
   * selection set (no silent truncation). When set lower than selection depth,
   * throws `SelectionTruncationError`. Historical default without include: 4.
   */
  maxRecursion?: number;
  /** Properties to explicitly exclude from the query */
  excludedProperties?: string[];
  /** Runtime validation mode for filters (from core-types) */
  filterValidationMode?: FilterValidationMode;
  /** Engine profile id (resolved to features via resolveSparqlFeatures) */
  flavour?: SPARQLFlavour;
  /** Partial feature overrides merged on top of the flavour defaults */
  sparqlFeatures?: Partial<SparqlFeatureFlags>;
}

/**
 * Result of filterable SPARQL query building
 */
export interface TypedSPARQLQueryResult {
  /** The complete SPARQL CONSTRUCT query string */
  query: string;
  /** Raw CONSTRUCT and WHERE patterns */
  constructResult: ConstructResult;
  /** The traversal schema used */
  traversalSchema: any;
}

/**
 * Build a SPARQL CONSTRUCT query from JSON Schema with optional filter validation
 *
 * This is the main entry point for building SPARQL queries with typed filter options.
 * It combines schema preparation, filter validation, and query generation.
 * Supports both single and multiple subject IRIs for batch queries.
 *
 * @template T - Document shape used to type filter options (caller-supplied)
 * @param subjectIRI - The IRI(s) of the subject(s) to query (single IRI or array)
 * @param typeIRIs - The type IRI(s) for the entities (can be undefined)
 * @param schema - JSON Schema for the data structure
 * @param options - Type-safe filter options (select, include, where, etc.)
 * @returns Complete SPARQL query with metadata
 *
 * @throws {Error} If filterValidationMode is 'throw' and filters are invalid
 *
 * @example
 * ```typescript
 * import { buildFilterableSPARQLQuery } from '@graviola/sparql-schema';
 * import type { JSONSchema7 } from 'json-schema';
 *
 * const personSchema: JSONSchema7 = { ... };
 *
 * const result = buildFilterableSPARQLQuery<Person>(
 *   'http://example.com/person/1',
 *   'http://example.com/Person',
 *   personSchema,
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
 * console.log(result.query);
 * ```
 */
export function buildFilterableSPARQLQuery<T = any>(
  subjectIRI: OptionalStringOrStringArray,
  typeIRIs: OptionalStringOrStringArray | undefined,
  schema: JSONSchema7,
  options: BuildFilterableSPARQLQueryOptions<T> = {},
): TypedSPARQLQueryResult {
  const {
    prefixMap = {},
    maxRecursion: explicitMaxRecursion,
    excludedProperties = [],
    filterValidationMode,
    flavour,
    sparqlFeatures,
    ...filterOptions
  } = options;

  const maxRecursion = resolveEffectiveMaxRecursion({
    include: filterOptions.include as
      | Record<string, import("@graviola/edb-graph-traversal").IncludeTree>
      | undefined,
    maxRecursion: explicitMaxRecursion,
  });

  const jsonSchema: JSONSchema7 = schema;

  // This applies select, include, omit, and validates WHERE filters
  const traversalSchema = buildTraversalSchema(jsonSchema, {
    ...filterOptions,
    filterValidationMode,
  });

  // Pass filter options through context for nested query construction
  const constructResult = traversalSchema2construct(
    subjectIRI,
    typeIRIs,
    traversalSchema,
    {
      prefixMap,
      maxRecursion,
      excludedProperties,
      filterOptions,
      flavour,
      sparqlFeatures,
    },
  );

  const query = buildSPARQLConstructQuery(constructResult, prefixMap);

  return {
    query,
    constructResult,
    traversalSchema,
  };
}
