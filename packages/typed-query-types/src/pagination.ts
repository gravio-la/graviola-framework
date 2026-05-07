/**
 * Prisma-style pagination and ordering — shared by typed include / filter patterns.
 */

/**
 * Sort order for ordering query results
 */
export type SortOrder = "asc" | "desc";

/**
 * Order by clause for a single property (Prisma-style)
 * Example: { name: 'asc' } or { createdAt: 'desc' }
 */
export type OrderByClause<T = any> = {
  [K in keyof T]?: SortOrder;
};

/**
 * Pagination options for limiting and offsetting relationship queries
 * Supports Prisma-style orderBy for sorting results
 */
export type PaginationOptions = {
  /** Maximum number of items to return */
  take?: number;
  /** Number of items to skip before returning results */
  skip?: number;
  /**
   * Order by clause(s) for sorting results (Prisma-style)
   * Can be a single object or array of objects
   * Example: { name: 'asc' } or [{ name: 'asc' }, { createdAt: 'desc' }]
   * Note: Required for pagination on blank nodes (unnamed nodes)
   */
  orderBy?: OrderByClause | OrderByClause[];
};

/**
 * Pagination metadata that can be attached to array schemas
 *
 * The `_stage` field indicates where pagination was applied:
 * - "extraction": Apply during graph traversal (default)
 * - "query": Already applied at SPARQL CONSTRUCT query stage (skip during extraction)
 */
export type PaginationMetadata = PaginationOptions & {
  _stage?: "query" | "extraction";
};
