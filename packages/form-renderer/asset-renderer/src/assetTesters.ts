import { assetKindForRef } from "@graviola/json-schema-utils";
import { isControl, rankWith, type RankedTester } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

/** Above {@link relationalFieldRendererTester} (20) and linked object (4). */
export const ASSET_FIELD_TESTER_RANK = 25;

/** Above {@link materialArrayOfLinkedItemTester} (5). */
export const ASSET_GALLERY_TESTER_RANK = 6;

export const assetFieldTester: RankedTester = rankWith(
  ASSET_FIELD_TESTER_RANK,
  (uischema, schema, context) => {
    if (!isControl(uischema)) return false;
    const s = schema as JSONSchema7;
    if (s.type === "array") return false;
    return assetKindForRef(context, s) !== undefined;
  },
);

export const assetGalleryTester: RankedTester = rankWith(
  ASSET_GALLERY_TESTER_RANK,
  (uischema, schema, context) => {
    if (!isControl(uischema)) return false;
    const s = schema as JSONSchema7;
    if (s.type !== "array") return false;
    return assetKindForRef(context, s) !== undefined;
  },
);
