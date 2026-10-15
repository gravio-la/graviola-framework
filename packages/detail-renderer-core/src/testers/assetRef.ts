import { and, isControl, rankWith } from "@jsonforms/core";
import type { Tester } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

import type { DetailTesterContext } from "../types";
import { assetKindForDetailSchema } from "./assetKindForDetailSchema";

export const isAssetRefControl: Tester = (
  _uischema,
  schema,
  context?: { config?: DetailTesterContext },
) => {
  const ctx = context?.config;
  const s = schema as JSONSchema7 | undefined;
  if (!s || s.type === "array") return false;
  return assetKindForDetailSchema(ctx, s) != null;
};

export const isArrayOfAssetRefs: Tester = (_uischema, schema, context) => {
  const s = schema as JSONSchema7 | undefined;
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
