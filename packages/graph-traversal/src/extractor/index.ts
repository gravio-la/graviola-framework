/**
 * New graph extractor implementation with traversal schemas
 *
 * This module provides a cleaner, more modular approach to extracting data
 * from RDF graphs using JSON Schemas. Key improvements:
 *
 * - Uses traversal schemas (all $refs resolved)
 * - Schema structure controls depth (no cycle detection needed)
 * - Supports Prisma-style filtering (select/include/omit)
 * - Pagination support for arrays
 * - Structured logging facade
 * - Better handling of anyOf/oneOf patterns
 *
 * @module extractor
 */

export { extractFromGraph } from "./extract";
export type { ExtractionContext, PaginationMetadata } from "./types";
