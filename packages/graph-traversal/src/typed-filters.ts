/**
 * Type-safe filter system for SPARQL graph traversal
 *
 * Re-exports type-safe filter types from core-types package.
 * This file is kept for backward compatibility.
 */

// Re-export all types from core-types
export type {
  StringFilterOperators,
  NumberFilterOperators,
  BooleanFilterOperators,
  DateTimeFilterOperators,
  GeoFilterOperators,
  FilterOperatorsForType,
  WhereInput as TypedWhereInput,
  FlavourAwareWhereInput,
  SelectPattern as TypedSelectPattern,
  OmitPattern as TypedOmitPattern,
  IncludePattern as TypedIncludePattern,
  GraphTraversalFilterOptions as TypedGraphTraversalFilterOptions,
  PaginationMetadata,
} from "@graviola/edb-core-types";

// For backward compatibility - export a type alias
export type NestedFilterOptions<T> = Partial<PaginationMetadata> & {
  select?: TypedSelectPattern<T>;
  include?: IncludePattern<T>;
  omit?: TypedOmitPattern<T>;
  where?: TypedWhereInput<T>;
};

// TypedFilterPattern is now available via TypedGraphTraversalFilterOptions
export type TypedFilterPattern<
  T = any,
  F extends "default" | "blazegraph" | "oxigraph" | "allegro" = "default",
> = {
  select?: TypedSelectPattern<T>;
  include?: IncludePattern<T>;
  omit?: TypedOmitPattern<T>;
  where?: FlavourAwareWhereInput<T, F>;
};

// Re-export for convenience
import type {
  SelectPattern as TypedSelectPattern,
  OmitPattern as TypedOmitPattern,
  WhereInput as TypedWhereInput,
  IncludePattern,
  FlavourAwareWhereInput,
  PaginationMetadata,
} from "@graviola/edb-core-types";
