import {
  resolveSchema,
  type JsonSchema,
  type SchemaRegistry,
} from "@graviola/json-schema-utils";
import { type Tester, schemaMatches } from "@jsonforms/core";

/** Array items are object schemas without an entity `@id` (anonymous / inline rows). */
export const isArrayOfAnonymousObjectItems: Tester = (
  schema,
  rootSchema,
  context,
) =>
  schemaMatches((_schema, _rootSchema) => {
    if (_schema.type !== "array" || typeof _schema.items !== "object") {
      return false;
    }
    const items = _schema.items as JsonSchema;

    const registry = (context as { config?: { registry?: SchemaRegistry } })
      ?.config?.registry;
    if (registry && (items as { $ref?: string }).$ref) {
      const entry = registry.byPath.get((items as { $ref: string }).$ref);
      if (entry !== undefined) {
        return !entry.isEntity;
      }
    }

    const resolvedSchema = resolveSchema(
      items,
      undefined,
      _rootSchema as JsonSchema,
    );
    if (!resolvedSchema || resolvedSchema.type !== "object") {
      return false;
    }
    return !resolvedSchema.properties?.["@id"];
  })(schema, rootSchema, context);
