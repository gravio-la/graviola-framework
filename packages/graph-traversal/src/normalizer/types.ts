import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";

/**
 * A normalized JSON Schema with all $refs resolved
 */
export type NormalizedSchema = JSONSchema7 & {
  /** Marker to indicate this schema has been normalized */
  _normalized: true;
};

/**
 * Context object passed through the normalization process
 */
export type NormalizationContext = {
  /** The root schema used for resolving $refs */
  rootSchema: JSONSchema7;
  /** Filter options to apply during normalization */
  filterOptions: GraphTraversalFilterOptions;
  /** Set of visited $ref paths to prevent infinite loops */
  visitedRefs: Set<string>;
  /** Current recursion depth */
  depth: number;
};

/**
 * Options for the ref resolution process
 */
export type RefResolutionOptions = {
  /** Maximum depth to resolve nested refs */
  maxDepth?: number;
  /** Whether to preserve the original $ref for debugging */
  preserveRefComments?: boolean;
};
