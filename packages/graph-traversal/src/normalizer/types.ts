import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";

/**
 * Metadata about a property in a normalized schema
 */
export type PropertyMetadata = {
  /** Whether this property represents a relationship to another entity */
  isRelationship: boolean;
  /** Whether this property is an array */
  isArray: boolean;
  /** The type of the items if this is an array */
  itemType?: "object" | "string" | "number" | "boolean" | "null";
  /** Pagination options if this is a relationship array */
  pagination?: {
    take?: number;
    skip?: number;
  };
};

/**
 * A normalized JSON Schema with all $refs resolved and metadata attached
 */
export type NormalizedSchema = JSONSchema7 & {
  /** Marker to indicate this schema has been normalized */
  _normalized: true;
  /** Metadata about each property */
  _propertyMetadata: Record<string, PropertyMetadata>;
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
