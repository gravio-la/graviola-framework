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
  SparqlBuildOptions,
  ResolvedSparqlFeatureFlags,
} from "@graviola/edb-core-types";
import { resolveSparqlFeatures } from "@graviola/edb-core-utils";
import {
  applyIncludeOrderByAndSlice,
  resolveEffectiveMaxRecursion,
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
  features: ResolvedSparqlFeatureFlags,
): T {
  if (!include) return document;
  // LATERAL already sliced at query stage — only restore array order.
  // Otherwise sort + slice in the app layer.
  const slice = !features.lateralNestedPagination;
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
    sparqlFeatures,
    include,
    maxRecursion: explicitMaxRecursion,
    ...buildOptions
  } = options;

  // Build prefix map from defaultPrefix if not provided
  const finalPrefixMap =
    Object.keys(prefixMap).length > 0
      ? prefixMap
      : defaultPrefix
        ? { "": defaultPrefix }
        : {};

  const features = resolveSparqlFeatures(flavour, sparqlFeatures);

  const maxRecursion = resolveEffectiveMaxRecursion({
    include: include as
      | Record<string, import("@graviola/edb-graph-traversal").IncludeTree>
      | undefined,
    maxRecursion: explicitMaxRecursion,
  });

  // Step 1: Build type-safe SPARQL query
  const { query, traversalSchema } = buildFilterableSPARQLQuery<T>(
    entityIRIs,
    typeIRIs,
    schema,
    {
      ...buildOptions,
      include,
      maxRecursion,
      flavour,
      sparqlFeatures,
      prefixMap: finalPrefixMap,
    },
  );

  // Step 2: Execute CONSTRUCT query
  const dataset = await constructFetch(query);

  // The QueryResultSubject marker is query-layer bookkeeping. Capture the
  // stamped subjects, then strip the marker quads so extraction sees a
  // single-valued rdf:type (clownface `.value` is undefined on multi-types,
  // which would drop `@type` from every root entity).
  const stampedSubjects = new Set(
    [...dataset.match(null, rdf.type, QUERY_RESULT_SUBJECT_IRI_NODE)].map(
      (quad) => quad.subject.value,
    ),
  );
  for (const quad of [
    ...dataset.match(null, rdf.type, QUERY_RESULT_SUBJECT_IRI_NODE),
  ]) {
    (dataset as Dataset).delete(quad);
  }

  // Extract against the traversal schema so omitted relations / select
  // projections match CONSTRUCT (Prisma-like includeRelationsByDefault: false).
  const extractSchema = (traversalSchema as JSONSchema7) || schema;

  const effectiveWalkerOptions: Partial<WalkerOptions> = {
    ...walkerOptions,
    // Keep extraction depth in sync with CONSTRUCT — do not silently recap.
    maxRecursion: walkerOptions?.maxRecursion ?? maxRecursion,
  };

  const extractOne = (iri: string): T => {
    const raw = traverseGraphExtractBySchema(
      defaultPrefix,
      iri,
      dataset as Dataset,
      extractSchema,
      effectiveWalkerOptions,
    ) as T;
    return postProcessDocument(raw, include, features);
  };

  if (Array.isArray(entityIRIs) && entityIRIs.length > 0) {
    // Only return subjects that actually appear in the CONSTRUCT result —
    // VALUES binds the candidate set; WHERE may exclude some of them.
    const stamped = stampedSubjects;
    const subjectsWithTriples = new Set<string>();
    for (const quad of dataset) {
      if (quad.subject.termType === "NamedNode") {
        subjectsWithTriples.add(quad.subject.value);
      }
    }
    const present = stamped.size > 0 ? stamped : subjectsWithTriples;
    return entityIRIs
      .filter((iri) => present.has(iri))
      .map((iri) => extractOne(iri));
  } else if (typeof entityIRIs === "string") {
    return [extractOne(entityIRIs)];
  }

  const results: T[] = [];
  for (const subjectIRI of stampedSubjects) {
    results.push(extractOne(subjectIRI));
  }
  return results;
}
