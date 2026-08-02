/**
 * Type-safe document filtering and loading with Prisma-style API
 *
 * This module provides high-level functions that combine:
 * - buildFilterableSPARQLQuery for filterable CONSTRUCT query generation
 * - SPARQL execution via constructFetch
 * - Data extraction via traverseGraphExtractBySchema
 * - Post-extraction orderBy / take / skip via applyIncludeOrderByAndSlice
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
import {
  applyIncludeOrderByAndSlice,
  traverseGraphExtractBySchema,
} from "@graviola/edb-graph-traversal";
import { buildFilterableSPARQLQuery } from "../schema2sparql/buildTypedSPARQLQuery";
import type { BuildFilterableSPARQLQueryOptions } from "../schema2sparql/buildTypedSPARQLQuery";
import {
  OptionalStringOrStringArray,
  QUERY_RESULT_SUBJECT_IRI_NODE,
} from "@/base";
import { rdf } from "@tpluscode/rdf-ns-builders";

/**
 * Options for filterTypedDocument
 * Extends BuildFilterableSPARQLQueryOptions with CRUD-specific options
 */
export interface TypedFilterOptions<
  T = any,
> extends BuildFilterableSPARQLQueryOptions<T> {
  /** Walker options for graph traversal */
  walkerOptions?: Partial<WalkerOptions>;
  /** Default prefix for IRI resolution */
  defaultPrefix?: string;
  /** Query build options for SPARQL generation */
  queryBuildOptions?: SparqlBuildOptions;
}

function postProcessDocument<T>(
  document: T,
  include: BuildFilterableSPARQLQueryOptions<T>["include"],
  flavour: BuildFilterableSPARQLQueryOptions<T>["flavour"],
): T {
  if (!include) return document;
  // LATERAL already sliced at query stage — only restore array order.
  // All other flavours must sort + slice in the app layer.
  const slice = flavour !== "lateral";
  return applyIncludeOrderByAndSlice(
    document,
    include as Record<string, unknown>,
    {
      slice,
    },
  );
}

/**
 * Load a single entity or batch of entities by IRI with type-safe filters
 *
 * This function combines:
 * 1. buildFilterableSPARQLQuery - generates filterable SPARQL CONSTRUCT query
 * 2. constructFetch - executes the query
 * 3. traverseGraphExtractBySchema - extracts structured data from RDF graph
 * 4. applyIncludeOrderByAndSlice - restores orderBy and applies take/skip when needed
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
    flavour,
    include,
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
  const { query } = buildFilterableSPARQLQuery<T>(
    entityIRIs,
    typeIRIs,
    schema,
    {
      ...buildOptions,
      include,
      flavour,
      prefixMap: finalPrefixMap,
    },
  );

  // Step 2: Execute CONSTRUCT query
  const dataset = await constructFetch(query);

  const extractOne = (iri: string): T => {
    const raw = traverseGraphExtractBySchema(
      defaultPrefix,
      iri,
      dataset as Dataset,
      schema,
      walkerOptions,
    ) as T;
    return postProcessDocument(raw, include, flavour);
  };

  if (Array.isArray(entityIRIs) && entityIRIs.length > 0) {
    return entityIRIs.map((iri) => extractOne(iri));
  } else if (typeof entityIRIs === "string") {
    return [extractOne(entityIRIs)];
  }

  const subjectIRIs = dataset.match(
    null,
    rdf.type,
    QUERY_RESULT_SUBJECT_IRI_NODE,
  );
  const results: T[] = [];
  for (const quad of subjectIRIs) {
    results.push(extractOne(quad.subject.value));
  }
  return results;
}
