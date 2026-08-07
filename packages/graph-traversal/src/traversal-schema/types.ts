import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";
import type { IncludeTree } from "./selectionDepth";

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
  /**
   * `$ref` paths already unrolled once on the CURRENT path from the dereference
   * root. Branch-local: callers must clone (never mutate in place) before
   * recursing into a resolved `$ref`, so sibling branches never see each
   * other's entries. Keyed by ref path alone (no depth suffix) — true
   * ancestor-path cycle detection, not depth-qualified.
   */
  visitedRefs: Set<string>;
  /**
   * Position in the caller's `include` tree corresponding to "here" in the
   * schema walk. `undefined` means "no explicit include-driven signal at this
   * position" — a legitimate end state, not "unset". Narrowed only when
   * stepping into a named property key; passed through unchanged for
   * items/allOf/anyOf/oneOf. Seeded exactly once, by `buildTraversalSchema`'s
   * initial context — never re-derived from `filterOptions.include` inside
   * `dereferenceSchema`'s own recursion, or a repeat-unroll budget would never
   * expire.
   */
  includeCursor?: Record<string, IncludeTree>;
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
