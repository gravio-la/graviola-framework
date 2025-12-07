import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";
import type { NormalizedSchema, NormalizationContext } from "./types";
import { resolveAllRefs } from "./resolveAllRefs";
import { applyFilters } from "./applyFilters";

/**
 * Normalizes a JSON Schema by resolving all $refs and applying filter options
 *
 * This is a two-phase process:
 * 1. Resolve all $ref references to create a flat schema structure
 * 2. Apply include/exclude/omit filters to determine which properties to traverse
 *
 * @template T - The type to derive filter patterns from (typically z.infer<typeof zodSchema>)
 * @param schema The JSON Schema to normalize
 * @param filterOptions Filter options for selecting/including/omitting properties
 * @returns A normalized schema with all refs resolved and filters applied
 *
 * @example
 * ```typescript
 * // Without type parameter (backward compatible)
 * const schema = {
 *   type: "object",
 *   properties: {
 *     name: { type: "string" },
 *     tags: {
 *       type: "array",
 *       items: { $ref: "#/$defs/Tag" }
 *     }
 *   },
 *   $defs: {
 *     Tag: {
 *       type: "object",
 *       properties: {
 *         label: { type: "string" },
 *         "@id": { type: "string" }
 *       }
 *     }
 *   }
 * };
 *
 * const normalized = normalizeSchema(schema, {
 *   include: { tags: { take: 10 } },
 *   includeRelationsByDefault: false
 * });
 *
 * // With Zod type inference for type safety
 * import { z } from 'zod';
 * const zodSchema = z.object({
 *   name: z.string(),
 *   tags: z.array(z.object({ label: z.string() }))
 * });
 * type MyType = z.infer<typeof zodSchema>;
 *
 * const normalized2 = normalizeSchema<MyType>(schema, {
 *   include: { tags: { take: 10 } } // Type-safe: only valid keys allowed
 * });
 * ```
 */
export function normalizeSchema<T = any>(
  schema: JSONSchema7,
  filterOptions: GraphTraversalFilterOptions<T> = {} as GraphTraversalFilterOptions<T>,
): NormalizedSchema {
  // Phase 1: Resolve all $refs
  const context: NormalizationContext = {
    rootSchema: schema,
    filterOptions,
    visitedRefs: new Set(),
    depth: 0,
  };

  const resolvedSchema = resolveAllRefs(schema, context);

  // Phase 2: Apply filters (pass rootSchema for nested filter resolution)
  const filteredSchema = applyFilters(
    resolvedSchema,
    filterOptions,
    schema,
    0, // Start at depth 0
  );

  // Return as normalized schema
  return {
    ...filteredSchema,
    _normalized: true,
  } as NormalizedSchema;
}

// Re-export types and utilities
export type { NormalizedSchema, NormalizationContext } from "./types";
export { resolveAllRefs, isRelationshipSchema } from "./resolveAllRefs";
export {
  applyFilters,
  shouldIncludeProperty,
  extractPaginationOptions,
} from "./applyFilters";
