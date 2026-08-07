import type { JSONSchema7, JSONSchema7Definition } from "json-schema";

/** Convention key applied by calc-profile annotation (see testapp annotateCalcSchema). */
export const X_CALC = "x-calc" as const;

function isSchemaObject(
  def: JSONSchema7Definition | undefined,
): def is JSONSchema7 {
  return typeof def === "object" && def !== null && !Array.isArray(def);
}

function resolveRef(root: JSONSchema7, ref: string): JSONSchema7 | undefined {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref.slice(2).split("/");
  let cur: unknown = root;
  for (const part of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return isSchemaObject(cur as JSONSchema7Definition)
    ? (cur as JSONSchema7)
    : undefined;
}

function resolveSchema(
  root: JSONSchema7,
  schema: JSONSchema7 | undefined,
): JSONSchema7 | undefined {
  if (!schema) return undefined;
  if (schema.$ref) {
    return resolveSchema(root, resolveRef(root, schema.$ref));
  }
  return schema;
}

function stripFromValue(
  root: JSONSchema7,
  schema: JSONSchema7 | undefined,
  value: unknown,
): unknown {
  if (value === null || value === undefined) return value;
  const resolved = resolveSchema(root, schema);
  if (!resolved) return value;

  if (Array.isArray(value)) {
    const items = resolved.items;
    const itemSchema = Array.isArray(items)
      ? undefined
      : isSchemaObject(items)
        ? items
        : undefined;
    return value.map((item) => stripFromValue(root, itemSchema, item));
  }

  if (typeof value !== "object") return value;

  const obj = value as Record<string, unknown>;
  const props = resolved.properties ?? {};
  const out: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(obj)) {
    const propSchema = resolveSchema(
      root,
      isSchemaObject(props[key]) ? props[key] : undefined,
    );
    if (propSchema && X_CALC in propSchema) {
      continue;
    }
    out[key] = stripFromValue(root, propSchema, child);
  }
  return out;
}

/**
 * Deep-clone `document` omitting properties whose schema node carries `x-calc`.
 * Ordinary `readOnly` without `x-calc` is kept.
 */
export function stripXCalcProperties(
  document: Record<string, unknown>,
  schema: JSONSchema7,
): Record<string, unknown> {
  const stripped = stripFromValue(schema, schema, document);
  return (
    stripped && typeof stripped === "object" && !Array.isArray(stripped)
      ? stripped
      : {}
  ) as Record<string, unknown>;
}
