/**
 * Rewrite JSON-LD identity keys to Prisma field names for persistence schemas.
 * Keeps a single `id` / `type` per definition (avoids duplicate columns from
 * also calling extendSchemaShortcut(PRISMA_SCHEMA_IDENTITY) on a schema that
 * already declares `@id` / `@type`).
 */
import type { JSONSchema7 } from "json-schema";

function rewriteProps(
  properties: Record<string, JSONSchema7> | undefined,
): Record<string, JSONSchema7> | undefined {
  if (!properties) return properties;
  const next: Record<string, JSONSchema7> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (key === "@id") {
      next.id = value as JSONSchema7;
      continue;
    }
    if (key === "@type") {
      next.type = value as JSONSchema7;
      continue;
    }
    next[key] = value as JSONSchema7;
  }
  return next;
}

function rewriteRequired(required: string[] | undefined): string[] | undefined {
  if (!required) return required;
  return required.map((k) => (k === "@id" ? "id" : k === "@type" ? "type" : k));
}

export function toPrismaPersistenceSchema(schema: JSONSchema7): JSONSchema7 {
  const definitions = (schema.definitions ?? schema.$defs) as
    | Record<string, JSONSchema7>
    | undefined;
  if (!definitions) return schema;

  const nextDefs: Record<string, JSONSchema7> = {};
  for (const [name, def] of Object.entries(definitions)) {
    if (typeof def !== "object" || def === null) continue;
    const props = rewriteProps(
      def.properties as Record<string, JSONSchema7> | undefined,
    );
    nextDefs[name] = {
      ...def,
      properties: props,
      required: rewriteRequired(def.required as string[] | undefined),
    };
  }

  return {
    ...schema,
    definitions: nextDefs,
  };
}
