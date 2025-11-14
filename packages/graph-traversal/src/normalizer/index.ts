import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";
import type {
  NormalizedSchema,
  NormalizationContext,
  PropertyMetadata,
} from "./types";
import { resolveAllRefs, extractPropertyMetadata } from "./resolveAllRefs";
import { applyFilters } from "./applyFilters";

/**
 * Normalizes a JSON Schema by resolving all $refs and applying filter options
 *
 * This is a two-phase process:
 * 1. Resolve all $ref references to create a flat schema structure
 * 2. Apply include/exclude/omit filters to determine which properties to traverse
 *
 * @param schema The JSON Schema to normalize
 * @param filterOptions Filter options for selecting/including/omitting properties
 * @returns A normalized schema with all refs resolved and filters applied
 *
 * @example
 * ```typescript
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
 * ```
 */
export function normalizeSchema(
  schema: JSONSchema7,
  filterOptions: GraphTraversalFilterOptions = {},
): NormalizedSchema {
  // Phase 1: Resolve all $refs
  const context: NormalizationContext = {
    rootSchema: schema,
    filterOptions,
    visitedRefs: new Set(),
    depth: 0,
  };

  const resolvedSchema = resolveAllRefs(schema, context);

  // Phase 2: Extract property metadata
  const propertyMetadata: Record<string, PropertyMetadata> = {};

  if (resolvedSchema.properties) {
    for (const [propName, propSchema] of Object.entries(
      resolvedSchema.properties,
    )) {
      if (typeof propSchema === "object" && !Array.isArray(propSchema)) {
        propertyMetadata[propName] = extractPropertyMetadata(
          propSchema as JSONSchema7,
          context,
        );
      }
    }
  }

  // Phase 3: Apply filters
  const filteredSchema = applyFilters(
    resolvedSchema,
    propertyMetadata,
    filterOptions,
  );

  // Return as normalized schema with metadata
  return {
    ...filteredSchema,
    _normalized: true,
    _propertyMetadata: propertyMetadata,
  } as NormalizedSchema;
}

// Re-export types and utilities
export type {
  NormalizedSchema,
  PropertyMetadata,
  NormalizationContext,
} from "./types";
export {
  resolveAllRefs,
  isRelationshipSchema,
  extractPropertyMetadata,
} from "./resolveAllRefs";
export {
  applyFilters,
  shouldIncludeProperty,
  extractPaginationOptions,
} from "./applyFilters";
