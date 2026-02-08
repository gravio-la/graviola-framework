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
import df from "@rdfjs/data-model";
import {
  OptionalStringOrStringArray,
  QUERY_RESULT_SUBJECT_IRI_NODE,
} from "@/base";
import { rdf } from "@tpluscode/rdf-ns-builders";

/**
 * Options for filterTypedDocument
 * Extends BuildTypedSPARQLQueryOptions with CRUD-specific options
 */
export interface TypedFilterOptions<
  T = any,
> extends BuildTypedSPARQLQueryOptions<T> {
  /** Walker options for graph traversal */
  walkerOptions?: Partial<WalkerOptions>;
  /** Default prefix for IRI resolution */
  defaultPrefix?: string;
  /** Query build options for SPARQL generation */
  queryBuildOptions?: SparqlBuildOptions;
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
 * @param entityIRIs - optional single IRI or array of IRIs to load
 * @param typeIRIs - optional single IRI or array of IRIs to filter by
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
 * const people = await filterTypedDocuments<Person>(
 *   ['http://example.com/person/1', 'http://example.com/person/2'],
 *   'http://example.com/Person',
 *   personSchema,
 *   constructFetch,
 *   { select: { name: true } }
 * );
 * ```
 */
export async function filterTypedDocuments<T = any>(
  entityIRIs: OptionalStringOrStringArray,
  typeIRIs: OptionalStringOrStringArray,
  schema: JSONSchema7,
  constructFetch: (query: string) => Promise<DatasetCore>,
  options: TypedFilterOptions<T> = {},
): Promise<T[]> {
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
  const { query } = buildTypedSPARQLQuery<T>(entityIRIs, typeIRIs, schema, {
    ...buildOptions,
    prefixMap: finalPrefixMap,
  });

  // Step 2: Execute CONSTRUCT query
  const dataset = await constructFetch(query);

  if (Array.isArray(entityIRIs) && entityIRIs.length > 0) {
    // Batch extraction
    const results: T[] = entityIRIs.map((iri) =>
      traverseGraphExtractBySchema(
        defaultPrefix,
        iri,
        dataset as Dataset,
        schema,
        walkerOptions,
      ),
    );
    return results;
  } else if (typeof entityIRIs === "string") {
    // Single entity extraction
    const result: T = await traverseGraphExtractBySchema(
      defaultPrefix,
      entityIRIs,
      dataset as Dataset,
      schema,
      walkerOptions,
    );
    return [result];
  }

  const subjectIRIs = dataset.match(
    null,
    rdf.type,
    QUERY_RESULT_SUBJECT_IRI_NODE,
  );
  const results: T[] = [];
  for (const quad of subjectIRIs) {
    results.push(
      traverseGraphExtractBySchema(
        defaultPrefix,
        quad.subject.value,
        dataset as Dataset,
        schema,
        walkerOptions,
      ),
    );
  }
  return results;
}
