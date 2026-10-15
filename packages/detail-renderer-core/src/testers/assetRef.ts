import { propertySchemaAtScope } from "@graviola/json-schema-utils";
import { and, isControl, rankWith } from "@jsonforms/core";
import type { ControlElement, Tester } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

import type { DetailTesterContext } from "../types";
import { assetKindForDetailSchema } from "./assetKindForDetailSchema";

function propertySchemaForControl(
  uischema: unknown,
  schema: JSONSchema7 | undefined,
  context?: {
    config?: DetailTesterContext;
    rootSchema?: JSONSchema7 | import("@jsonforms/core").JsonSchema;
  },
): JSONSchema7 | undefined {
  const ctx = context?.config;
  const root = (context?.rootSchema ?? ctx?.rootSchema) as
    | JSONSchema7
    | undefined;
  if (isControl(uischema) && root) {
    const scope = (uischema as ControlElement).scope;
    if (!scope || scope === "#") {
      return schema;
    }
    const atScope = propertySchemaAtScope(root, scope, root);
    if (atScope && typeof atScope === "object" && !Array.isArray(atScope)) {
      return atScope as JSONSchema7;
    }
  }
  return schema;
}

export const isAssetRefControl: Tester = (uischema, schema, context) => {
  const ctx = context?.config;
  const s = propertySchemaForControl(
    uischema,
    schema as JSONSchema7 | undefined,
    context,
  );
  if (!s || s.type === "array") return false;
  return assetKindForDetailSchema(ctx, s) != null;
};

export const isArrayOfAssetRefs: Tester = (uischema, schema, context) => {
  const s = propertySchemaForControl(
    uischema,
    schema as JSONSchema7 | undefined,
    context,
  );
  if (s?.type !== "array") return false;
  return assetKindForDetailSchema(context?.config, s) != null;
};

/** Above {@link namedEntityTester} (5) and {@link imageUriTester} (5). */
export const assetRefTester = rankWith(6, and(isControl, isAssetRefControl));

/** Above {@link arraynamedEntityTester} (4) and image URI arrays (4). */
export const arrayOfAssetRefsTester = rankWith(
  6,
  and(isControl, isArrayOfAssetRefs),
);

/** Value-renderer selection for asset-class properties (same rank as control). */
export const assetValueRefTester = assetRefTester;
