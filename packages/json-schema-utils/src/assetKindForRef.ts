import type { JSONSchema7 } from "json-schema";

import { definitionNameFromRef } from "./definitionScope";
import { propertySchemaAtScope } from "./propertySchemaAtScope";
import { extractTypeIRI, type SchemaRegistry } from "./schemaRegistry";

export type AssetKind = "image" | "file";

export type AssetKindContext = {
  config?: {
    registry?: SchemaRegistry;
    assetClasses?: Record<string, AssetKind>;
  };
};

function refFromSchema(schemaOrRef: JSONSchema7): string | undefined {
  if (schemaOrRef.$ref) return schemaOrRef.$ref;
  if (
    schemaOrRef.type === "array" &&
    typeof schemaOrRef.items === "object" &&
    !Array.isArray(schemaOrRef.items)
  ) {
    return (schemaOrRef.items as JSONSchema7).$ref;
  }
  return undefined;
}

/**
 * Resolve `image` / `file` for a property schema or `$ref` using the compiled
 * schema registry and side-schema `assetClasses`.
 */
export function assetKindForRef(
  context: AssetKindContext | undefined,
  schemaOrRef: JSONSchema7,
): AssetKind | undefined {
  const assetClasses = context?.config?.assetClasses;
  if (!assetClasses) return undefined;

  const registry = context?.config?.registry;

  const ref = refFromSchema(schemaOrRef);
  if (ref) {
    const className =
      registry?.byPath.get(ref)?.name ?? definitionNameFromRef(ref);
    if (className && assetClasses[className]) {
      return assetClasses[className];
    }
    // Forms link to `<Class>Stub` definitions (see stubHelper), not to the class itself.
    const stubbed = className?.endsWith("Stub")
      ? className.slice(0, -"Stub".length)
      : undefined;
    if (stubbed && assetClasses[stubbed]) {
      return assetClasses[stubbed];
    }
  }

  const typeIRI = extractTypeIRI(schemaOrRef);
  if (typeIRI && registry) {
    const entry = registry.byTypeIRI.get(typeIRI);
    if (entry && assetClasses[entry.name]) {
      return assetClasses[entry.name];
    }
  }

  if (schemaOrRef.type === "array") {
    const items = schemaOrRef.items;
    if (items && typeof items === "object" && !Array.isArray(items)) {
      return assetKindForRef(context, items as JSONSchema7);
    }
  }

  return undefined;
}

/**
 * Resolve asset kind for a JSON Forms control from the form root schema and
 * the control's `scope` (property schema with terminal `$ref` preserved).
 */
export function assetKindForScope(
  context: AssetKindContext | undefined,
  formSchema: JSONSchema7,
  scope: string | undefined,
): AssetKind | undefined {
  if (!scope) return undefined;
  const rootSchema =
    (context as { rootSchema?: JSONSchema7 } | undefined)?.rootSchema ??
    formSchema;
  const prop = propertySchemaAtScope(formSchema, scope, rootSchema);
  if (!prop || typeof prop === "boolean" || Array.isArray(prop)) {
    return undefined;
  }
  return assetKindForRef(context, prop as JSONSchema7);
}
