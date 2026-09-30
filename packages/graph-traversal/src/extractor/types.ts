import type { DatasetCore } from "@rdfjs/types";
import type {
  ExtendedWalkerOptions,
  PaginationMetadata,
} from "@graviola/edb-core-types";
import type { TraversalSchema } from "../traversal-schema";
import type { Logger } from "@graviola/edb-core-types";

// Re-export PaginationMetadata for backward compatibility
export type { PaginationMetadata };

/**
 * Context passed through the extraction process
 * Contains all necessary state and configuration for extracting data from the graph
 */
export type ExtractionContext = {
  /** Base IRI for expanding property names */
  baseIRI: string;
  /** The RDF dataset to extract from */
  dataset: DatasetCore;
  /** Traversal schema (dereferenced then projected) */
  traversalSchema: TraversalSchema;
  /** Walker options including filter options */
  options: Partial<ExtendedWalkerOptions>;
  /** Optional prefix mappings for property name expansion (e.g., "dc" -> "http://purl.org/dc/elements/1.1/") */
  context?: Record<string, string>;
  /** Current depth in the extraction tree */
  depth: number;
  /** Logger for debugging and monitoring */
  logger: Logger;
};
