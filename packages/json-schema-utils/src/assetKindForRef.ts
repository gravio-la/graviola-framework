import type { JSONSchema7 } from "json-schema";

import type { SchemaRegistry } from "./schemaRegistry";

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

  const ref = refFromSchema(schemaOrRef);
  if (!ref) return undefined;

  const registry = context?.config?.registry;
  const className = registry?.byPath.get(ref)?.name;
  if (!className) return undefined;

  return assetClasses[className];
}
