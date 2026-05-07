import type { WalkerOptions } from "@graviola/edb-core-types";
import type { TypedGraphTraversalFilterOptions } from "@graviola/typed-query-types";

/**
 * Traversal options for Filters capability — extends typed-query-types patterns with walker knobs.
 */
export type StoreFilterTraversalOptions<
  T = unknown,
  F extends "default" | "blazegraph" | "oxigraph" | "allegro" = "default",
> = TypedGraphTraversalFilterOptions<T, F> & {
  walkerOptions?: Partial<WalkerOptions>;
  maxRecursion?: number;
};

/**
 * Options for listing / filtering many documents (includes search string + limit).
 */
export type StoreDocumentsSearchOptions<
  T = unknown,
  F extends "default" | "blazegraph" | "oxigraph" | "allegro" = "default",
> = StoreFilterTraversalOptions<T, F> & {
  searchString?: string | null;
  limit?: number;
};
