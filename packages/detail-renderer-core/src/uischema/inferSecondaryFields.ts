import type { PrimaryField } from "@graviola/edb-core-types";
import type { JsonSchema } from "@jsonforms/core";
import { resolveSchema } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

const LINKED_DATA = new Set(["@id", "@type"]);
const DEFAULT_SECONDARY_LIMIT = 3;

function resolvePropSchema(
  propSchema: JSONSchema7,
  rootSchema: JsonSchema,
): JSONSchema7 {
  if (propSchema.$ref) {
    const resolved = resolveSchema(rootSchema, propSchema.$ref, rootSchema) as
      | JSONSchema7
      | undefined;
    return resolved ?? propSchema;
  }
  return propSchema;
}

/** True for scalar / enum leaf properties suitable for compact card rows. */
export function isLeafPropertySchema(schema: JSONSchema7): boolean {
  const t = schema.type;
  if (t === "string" || t === "number" || t === "integer" || t === "boolean") {
    return true;
  }
  if (Array.isArray(t)) {
    return t.some((x) =>
      ["string", "number", "integer", "boolean"].includes(x as string),
    );
  }
  if (schema.enum?.length || schema.oneOf?.length) return true;
  return false;
}

function primaryFieldNames(primary: PrimaryField | undefined): Set<string> {
  const names = new Set<string>();
  if (primary?.label) names.add(primary.label);
  if (primary?.description) names.add(primary.description);
  if (primary?.image) names.add(primary.image);
  return names;
}

/**
 * Infer ranked secondary leaf property names from a schema object definition,
 * excluding primary hero fields and linked-data keys.
 */
export function inferSecondaryFields(
  schema: JsonSchema,
  primary: PrimaryField | undefined,
  limit = DEFAULT_SECONDARY_LIMIT,
  explicit?: string[],
  rootSchema?: JsonSchema,
  excludeNames: string[] = [],
): string[] {
  if (explicit?.length) {
    return explicit.slice(0, limit);
  }

  const root = (rootSchema ?? schema) as JSONSchema7;
  const objectSchema = schema as JSONSchema7;
  const props = objectSchema.properties;
  if (!props) return [];

  const excluded = primaryFieldNames(primary);
  LINKED_DATA.forEach((k) => excluded.add(k));
  excludeNames.forEach((k) => excluded.add(k));

  const candidates: string[] = [];
  for (const propName of Object.keys(props)) {
    if (excluded.has(propName)) continue;
    const resolved = resolvePropSchema(
      props[propName] as JSONSchema7,
      root as JsonSchema,
    );
    if (isLeafPropertySchema(resolved)) {
      candidates.push(propName);
    }
  }

  return candidates.slice(0, limit);
}
