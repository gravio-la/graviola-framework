import { resolvePropertySchema } from "@graviola/edb-detail-renderer-core";
import type { JSONSchema7 } from "json-schema";

const TECHNICAL_KEYS = new Set(["@id", "@type"]);
const MAX_LEAF_INLINE_PROPERTIES = 6;

function schemaDeclaresArrayType(schema: JSONSchema7 | undefined): boolean {
  const t = schema?.type;
  return (
    t === "array" || (Array.isArray(t) && (t as string[]).includes("array"))
  );
}

function schemaDeclaresObjectType(schema: JSONSchema7 | undefined): boolean {
  const t = schema?.type;
  return (
    t === "object" || (Array.isArray(t) && (t as string[]).includes("object"))
  );
}

function isMarkdownOrLongTextField(schema: JSONSchema7): boolean {
  if (schema.contentMediaType === "text/markdown") return true;
  if (schema.format === "markdown") return true;
  return false;
}

/**
 * Anonymous array items whose properties are all compact scalars, entity refs, or enums —
 * suitable for one horizontal wrapping row per item (ingredient lines, etc.).
 */
export function isCompactLeafOnlyItemSchema(
  itemSchema: JSONSchema7,
  rootSchema: JSONSchema7,
): boolean {
  const props = itemSchema.properties;
  if (!props || typeof props !== "object") return false;

  const names = Object.keys(props).filter((k) => !TECHNICAL_KEYS.has(k));
  if (names.length === 0 || names.length > MAX_LEAF_INLINE_PROPERTIES) {
    return false;
  }

  for (const propName of names) {
    const propSchema = props[propName] as JSONSchema7;
    const resolved = resolvePropertySchema(propSchema, rootSchema);
    if (schemaDeclaresArrayType(resolved)) return false;
    if (isMarkdownOrLongTextField(resolved)) return false;
    if (
      !propSchema.$ref &&
      schemaDeclaresObjectType(resolved) &&
      resolved.properties != null
    ) {
      return false;
    }
  }

  return true;
}
