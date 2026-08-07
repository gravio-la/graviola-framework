import type { JSONSchema7 } from "json-schema";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";
import type { TraversalSchema, DereferenceContext } from "./types";
import { dereferenceSchema } from "./dereferenceSchema";
import { projectSchema } from "./projectSchema";

/**
 * Prepare a JSON Schema for graph traversal / SPARQL CONSTRUCT generation.
 *
 * Two phases (intentionally separate concerns):
 * 1. **Dereference** — inline all `$ref` targets (`dereferenceSchema`). This is
 *    denormalization in the database sense: factored `definitions` are duplicated
 *    at each use site so downstream code can walk `.properties` without resolution.
 * 2. **Project** — prune by the selection set (`projectSchema`: `select` / `include` /
 *    `omit` / `where`).
 *
 * Prefer calling the phases separately when you need only one of them.
 * Reserve "normalize" / "canonicalize" for true normal-form transforms such as
 * `canonicalizeSchemaForFingerprint` in `@graviola/json-schema-utils`.
 *
 * @template T - Type to derive filter patterns from (typically `z.infer<typeof zodSchema>`)
 * @param schema The JSON Schema to prepare
 * @param filterOptions Selection set for projecting properties
 * @returns A `TraversalSchema` (dereferenced then projected)
 *
 * @example
 * ```typescript
 * const traversal = buildTraversalSchema(schema, {
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
 * const traversal2 = buildTraversalSchema<MyType>(schema, {
 *   include: { tags: { take: 10 } } // Type-safe: only valid keys allowed
 * });
 * ```
 */
export function buildTraversalSchema<T = any>(
  schema: JSONSchema7,
  filterOptions: GraphTraversalFilterOptions<T> = {} as GraphTraversalFilterOptions<T>,
): TraversalSchema {
  // Phase 1: Dereference all $refs
  const context: DereferenceContext = {
    rootSchema: schema,
    filterOptions,
    visitedRefs: new Set(),
    depth: 0,
  };

  const dereferenced = dereferenceSchema(schema, context);

  // Phase 2: Project by selection set (pass rootSchema for nested filter resolution)
  const projected = projectSchema(
    dereferenced,
    filterOptions,
    schema,
    0, // Start at depth 0
  );

  return {
    ...projected,
    _traversalSchema: true,
  } as TraversalSchema;
}

export type {
  TraversalSchema,
  DereferencedSchema,
  ProjectedSchema,
  DereferenceContext,
} from "./types";
export { dereferenceSchema, isRelationshipSchema } from "./dereferenceSchema";
export {
  projectSchema,
  referencedRootWhereFilterProperties,
  shouldIncludeProperty,
  extractPaginationOptions,
  orderByPropertyKeys,
} from "./projectSchema";
