import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";

/**
 * Schema with all `$ref` targets inlined (definitions denormalized into use sites).
 * Cycles are broken by substituting an `{"@id": string}` stub.
 */
export type DereferencedSchema = JSONSchema7;

/**
 * Dereferenced schema after selection/projection (`select` / `include` / `omit` / `where`).
 */
export type ProjectedSchema = JSONSchema7;

/**
 * Schema ready for graph traversal / SPARQL CONSTRUCT generation:
 * `$ref`s dereferenced, then projected by the selection set.
 *
 * Invariant: no `$ref` survives; walk `.properties` without further resolution.
 */
export type TraversalSchema = JSONSchema7 & {
  /** Marker that this schema was produced by `buildTraversalSchema` */
  _traversalSchema: true;
};

/**
 * Context passed through `$ref` dereferencing
 */
export type DereferenceContext = {
  /** The root schema used for resolving `$ref`s */
  rootSchema: JSONSchema7;
  /** Selection / filter options (carried for callers; projection is a separate phase) */
  filterOptions: GraphTraversalFilterOptions;
  /** Set of visited `$ref` paths to prevent infinite loops */
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
  /** Whether to preserve the original `$ref` for debugging */
  preserveRefComments?: boolean;
};
