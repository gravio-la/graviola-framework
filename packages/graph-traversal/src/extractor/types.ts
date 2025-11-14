import type { DatasetCore } from "@rdfjs/types";
import type { JSONSchema7 } from "json-schema";
import type { ExtendedWalkerOptions } from "@graviola/edb-core-types";
import type { NormalizedSchema, PropertyMetadata } from "../normalizer";
import type { Logger } from "./logger";

/**
 * Pagination metadata that can be attached to array schemas
 *
 * The `source` field indicates where pagination was applied:
 * - "extraction": Apply during graph traversal (default)
 * - "query": Already applied at SPARQL CONSTRUCT query stage (skip during extraction)
 */
export type PaginationMetadata = {
  /** Number of items to skip */
  skip?: number;
  /** Maximum number of items to take */
  take?: number;
  /** Where pagination was applied - prevents double pagination */
  source?: "extraction" | "query";
};

/**
 * Context passed through the extraction process
 * Contains all necessary state and configuration for extracting data from the graph
 */
export type ExtractionContext = {
  /** Base IRI for expanding property names */
  baseIRI: string;
  /** The RDF dataset to extract from */
  dataset: DatasetCore;
  /** The normalized schema (all $refs resolved) */
  normalizedSchema: NormalizedSchema;
  /** Walker options including filter options */
  options: Partial<ExtendedWalkerOptions>;
  /** Optional prefix mappings for property name expansion (e.g., "dc" -> "http://purl.org/dc/elements/1.1/") */
  context?: Record<string, string>;
  /** Current depth in the extraction tree */
  depth: number;
  /** Logger for debugging and monitoring */
  logger: Logger;
};

/**
 * The result of extracting a value from the graph
 * Can be any valid JSON value
 */
export type ExtractedValue = any;

/**
 * Function signature for property extractors
 * Each extractor handles a specific type of property (literal, object, array, etc.)
 */
export type PropertyExtractor = (
  node: any, // clownface.GraphPointer
  propertySchema: JSONSchema7,
  propertyMetadata: PropertyMetadata,
  ctx: ExtractionContext,
) => ExtractedValue;
