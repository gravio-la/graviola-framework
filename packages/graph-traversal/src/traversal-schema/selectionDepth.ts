/**
 * Re-export selection-depth helpers from `@graviola/typed-query-types`
 * so graph-traversal / SPARQL callers keep a single import surface.
 */
export {
  selectionDepth,
  truncatedSelectionPaths,
  resolveEffectiveMaxRecursion,
  SelectionTruncationError,
} from "@graviola/typed-query-types";
export type { IncludeTree } from "@graviola/typed-query-types";
