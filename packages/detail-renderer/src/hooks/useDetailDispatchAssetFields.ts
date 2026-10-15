import { useMemo } from "react";
import type { JSONSchema7 } from "json-schema";
import {
  compileSchema,
  type SchemaRegistry,
} from "@graviola/json-schema-utils";

export type DetailDispatchAssetFields = {
  assetClasses?: Record<string, "image" | "file">;
  schemaRegistry?: SchemaRegistry;
};

/** Memoized `assetClasses` + `compileSchema` pair for detail dispatch ctx. */
export function useDetailDispatchAssetFields(
  rootSchema: JSONSchema7 | undefined,
  assetClasses: Record<string, "image" | "file"> | undefined,
): DetailDispatchAssetFields {
  const schemaRegistry = useMemo(
    () => (rootSchema ? compileSchema(rootSchema) : undefined),
    [rootSchema],
  );
  return useMemo(
    () => ({ assetClasses, schemaRegistry }),
    [assetClasses, schemaRegistry],
  );
}
