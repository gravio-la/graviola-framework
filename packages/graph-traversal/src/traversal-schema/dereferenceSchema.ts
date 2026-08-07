import type { JSONSchema7, JSONSchema7Definition } from "json-schema";
import { resolveSchema, isJSONSchema } from "@graviola/json-schema-utils";
import {
  resolveEffectiveMaxRecursion,
  type IncludeTree,
} from "./selectionDepth";
import type { DereferenceContext } from "./types";

/**
 * Default repeat-unroll budget for a `$ref` reappearing on the current
 * dereference path: stub immediately, no free depth. Deliberately more
 * conservative than `resolveEffectiveMaxRecursion`'s own default (4), which
 * is tuned for a later, already-`include`-aware query stage reached only
 * after a selection exists. `dereferenceSchema` runs unconditionally on
 * every `buildTraversalSchema` call, including the zero-argument form — a
 * default of 4 would make every self-referential schema expand 4 levels
 * deep purely because dereferencing doesn't yet know projection is about to
 * discard most of it. The only way to get more than one level of
 * self-reference is to explicitly request it via `include`.
 */
const DEFAULT_CYCLE_BUDGET = 0;

/** Step the include cursor into a named property — the only site that narrows. */
function narrowIncludeCursor(
  cursor: Record<string, IncludeTree> | undefined,
  key: string,
): Record<string, IncludeTree> | undefined {
  const entry = cursor?.[key];
  return entry && typeof entry === "object"
    ? (entry.include as Record<string, IncludeTree> | undefined)
    : undefined;
}

/**
 * Checks if a schema represents a relationship (an object with @id property).
 *
 * Returns true when @id is present:
 * - directly in `properties` (Pattern A, B, C, D), OR
 * - in any member of an `allOf` array (Pattern E — inheritance via allOf)
 *
 * @param schema The schema to check
 * @returns True if this schema represents a named entity
 */
export function isRelationshipSchema(schema: JSONSchema7): boolean {
  // Direct @id property
  if (schema.properties && "@id" in schema.properties) {
    return true;
  }

  // allOf-inherited @id (Pattern E)
  if (schema.allOf) {
    return schema.allOf.some(
      (part) =>
        typeof part === "object" &&
        part !== null &&
        (part as JSONSchema7).properties !== undefined &&
        "@id" in (part as JSONSchema7).properties!,
    );
  }

  return false;
}

export interface PropertyMetadata {
  isArray: boolean;
  itemType?: string;
  isRelationship: boolean;
}

/**
 * Extracts metadata about a property schema: whether it is an array, its item
 * type, and whether it (or its items) represents a named entity relationship.
 */
export function extractPropertyMetadata(
  schema: JSONSchema7,
  _context: DereferenceContext,
): PropertyMetadata {
  if (schema.type === "array") {
    const items = Array.isArray(schema.items)
      ? (schema.items[0] as JSONSchema7 | undefined)
      : (schema.items as JSONSchema7 | undefined);
    const itemType = items?.type as string | undefined;
    return {
      isArray: true,
      itemType,
      isRelationship: items ? isRelationshipSchema(items) : false,
    };
  }
  return {
    isArray: false,
    isRelationship: isRelationshipSchema(schema),
  };
}

/**
 * Recursively resolves all $ref references in a schema
 * @param schema The schema to resolve
 * @param context Normalization context
 * @returns A new schema with all $refs resolved
 */
export function dereferenceSchema(
  schema: JSONSchema7,
  context: DereferenceContext,
): JSONSchema7 {
  // Avoid infinite recursion
  if (context.depth > 50) {
    return schema;
  }

  // If this is a $ref, resolve it
  if (schema.$ref) {
    const refPath = schema.$ref;

    // First occurrence of this ref on the current path: always expand (this
    // is ordinary dereferencing, not a repeat). Second and later occurrences
    // on the SAME path: only expand again if the caller's `include` tree,
    // from here, still explicitly asks for more — otherwise stub. This is
    // ancestor-path cycle detection (unaffected by numeric depth), so a real
    // structural cycle (e.g. Category.subCategories / Category.parentCategory,
    // both siblings $ref-ing Category) is bounded to one real level with no
    // caller input needed, while an explicit multi-level self-reference
    // request (e.g. `include: { knows: { include: { knows: {...} } } }`) is
    // honoured up to the depth actually requested.
    if (context.visitedRefs.has(refPath)) {
      const budget = resolveEffectiveMaxRecursion({
        include: context.includeCursor,
        defaultMaxRecursion: DEFAULT_CYCLE_BUDGET,
      });
      if (budget <= 0) {
        // Return a simplified version to break the cycle
        return {
          type: "object",
          properties: {
            "@id": { type: "string" },
          },
        };
      }
    }

    // Branch-local: clone before adding, never mutate the shared Set — two
    // sibling properties reaching the same ref independently (e.g. two
    // calc-materialized properties sharing a value-object $ref) must not see
    // each other's visited entries.
    const nextVisited = new Set(context.visitedRefs);
    nextVisited.add(refPath);

    // Resolve the reference from the root schema (refs are always relative to root)
    const resolved = resolveSchema(
      context.rootSchema,
      refPath,
      context.rootSchema,
    );

    if (resolved && isJSONSchema(resolved as JSONSchema7Definition)) {
      // Recursively resolve the resolved schema (cast to JSONSchema7 as we only support v7)
      return dereferenceSchema(resolved as JSONSchema7, {
        ...context,
        depth: context.depth + 1,
        visitedRefs: nextVisited,
        // Resolving a $ref isn't a property key-step — cursor passes through.
        includeCursor: context.includeCursor,
      });
    }

    return schema;
  }

  // Create a new schema object (immutable approach)
  const newSchema: JSONSchema7 = { ...schema };

  // Resolve properties
  if (schema.properties) {
    newSchema.properties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      if (typeof value === "boolean") {
        newSchema.properties[key] = value;
      } else if (isJSONSchema(value)) {
        // Recursively resolve each property (this will handle $refs in properties).
        // Only site that narrows the include cursor — stepping into a named
        // property is the only thing that corresponds to an include-tree key.
        newSchema.properties[key] = dereferenceSchema(value as JSONSchema7, {
          ...context,
          depth: context.depth + 1,
          includeCursor: narrowIncludeCursor(context.includeCursor, key),
        });
      } else {
        newSchema.properties[key] = value;
      }
    }
  }

  // Resolve items (for arrays)
  if (schema.items) {
    if (Array.isArray(schema.items)) {
      newSchema.items = schema.items.map((item) => {
        if (isJSONSchema(item)) {
          return dereferenceSchema(item as JSONSchema7, {
            ...context,
            depth: context.depth + 1,
          });
        }
        return item;
      });
    } else if (isJSONSchema(schema.items)) {
      newSchema.items = dereferenceSchema(schema.items as JSONSchema7, {
        ...context,
        depth: context.depth + 1,
      });
    }
  }

  // Resolve allOf
  if (schema.allOf) {
    newSchema.allOf = schema.allOf.map((subSchema) => {
      if (isJSONSchema(subSchema)) {
        return dereferenceSchema(subSchema as JSONSchema7, {
          ...context,
          depth: context.depth + 1,
        });
      }
      return subSchema;
    });
  }

  // Resolve anyOf
  if (schema.anyOf) {
    newSchema.anyOf = schema.anyOf.map((subSchema) => {
      if (isJSONSchema(subSchema)) {
        return dereferenceSchema(subSchema as JSONSchema7, {
          ...context,
          depth: context.depth + 1,
        });
      }
      return subSchema;
    });
  }

  // Resolve oneOf
  if (schema.oneOf) {
    newSchema.oneOf = schema.oneOf.map((subSchema) => {
      if (isJSONSchema(subSchema)) {
        return dereferenceSchema(subSchema as JSONSchema7, {
          ...context,
          depth: context.depth + 1,
        });
      }
      return subSchema;
    });
  }

  return newSchema;
}
