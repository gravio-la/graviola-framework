import type { JSONSchema7, JSONSchema7Definition } from "json-schema";
import get from "lodash-es/get";

import { decode } from "./jsonPointer";
import { isJSONSchema, isJSONSchemaDefinition } from "./jsonSchema";
import { resolveSchema } from "./resolver";

function scopeSegments(scope: string): string[] {
  return scope
    .split("/")
    .map(decode)
    .filter((s) => s.length > 0 && s !== "#");
}

function dereferenceIntermediate(
  node: JSONSchema7,
  rootSchema: JSONSchema7,
): JSONSchema7 {
  if (!node.$ref) return node;
  const resolved = resolveSchema(rootSchema, node.$ref, rootSchema);
  return (resolved as JSONSchema7 | undefined) ?? node;
}

/**
 * Walk a JSON Forms control scope against `schema` and return the property
 * sub-schema at the leaf **without** dereferencing a terminal `$ref`.
 *
 * Intermediate `$ref` nodes (including when traversing into a referenced
 * definition) are resolved via `rootSchema` so nested `properties` / `items`
 * segments keep working.
 */
export function propertySchemaAtScope(
  schema: JSONSchema7,
  scope: string | undefined,
  rootSchema: JSONSchema7,
): JSONSchema7Definition | undefined {
  if (!scope) return undefined;
  const segments = scopeSegments(scope);
  if (segments.length === 0) return schema;

  let current: unknown = schema;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;

    if (
      !isLast &&
      isJSONSchemaDefinition(current as JSONSchema7Definition) &&
      isJSONSchema(current as JSONSchema7)
    ) {
      current = dereferenceIntermediate(current as JSONSchema7, rootSchema);
    }

    if (current == null || typeof current !== "object") return undefined;
    current = get(current as object, segment);

    if (
      !isLast &&
      isJSONSchemaDefinition(current as JSONSchema7Definition) &&
      isJSONSchema(current as JSONSchema7)
    ) {
      current = dereferenceIntermediate(current as JSONSchema7, rootSchema);
    }
  }

  if (
    current === undefined ||
    (typeof current === "object" && current !== null && Array.isArray(current))
  ) {
    return undefined;
  }
  return current as JSONSchema7Definition;
}
