/**
 * List / search query shape aligned with legacy `QueryType` (`@graviola/edb-global-types`)
 * without taking a dependency on that package.
 */
export type PaginationState = {
  pageIndex: number;
  pageSize: number;
};

/** Shared across list, stream, and count operations */
export type StoreListQuery = Partial<{
  pagination: PaginationState;
  sorting: { id: string; desc?: boolean }[];
  /** Full-text / substring match against configured label fields */
  search: string;
  /** Omit or `true`: case-insensitive (default). `false`: case-sensitive. */
  insensitive: boolean;
  /** Top-level domain property keys to include in flat SELECT (empty = all). */
  fields: string[];
  /** UI scopes for opt-in meta annotation projection in SPARQL flat SELECT. */
  annotationScopes: string[];
}>;
