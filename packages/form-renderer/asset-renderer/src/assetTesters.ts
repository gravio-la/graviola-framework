import {
  assetKindForScope,
  propertySchemaAtScope,
} from "@graviola/json-schema-utils";
import {
  isControl,
  rankWith,
  type ControlElement,
  type RankedTester,
} from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

/**
 * Above {@link relationalFieldRendererTester} and {@link inlineDropdownRendererTester}
 * (20) — those match any control with `options.dropdown` / `options.inline`, including
 * asset-class `$ref` fields that must use {@link AssetFieldRenderer} instead.
 */
export const ASSET_FIELD_TESTER_RANK = 25;

/**
 * Above {@link materialArrayChipsLayoutTester} (6) and
 * {@link materialArrayOfLinkedItemTester} (5) — asset arrays are linked entities
 * in the registry but must render as {@link AssetGalleryRenderer}.
 */
export const ASSET_GALLERY_TESTER_RANK = 21;

export const assetFieldTester: RankedTester = rankWith(
  ASSET_FIELD_TESTER_RANK,
  (uischema, schema, context) => {
    if (!isControl(uischema)) return false;
    const scope = (uischema as ControlElement).scope;
    const formSchema = schema as JSONSchema7;
    const rootSchema =
      (context as { rootSchema?: JSONSchema7 }).rootSchema ?? formSchema;
    const atScope = propertySchemaAtScope(formSchema, scope, rootSchema);
    if (
      !atScope ||
      typeof atScope !== "object" ||
      Array.isArray(atScope) ||
      (atScope as JSONSchema7).type === "array"
    ) {
      return false;
    }
    return assetKindForScope(context, formSchema, scope) !== undefined;
  },
);

export const assetGalleryTester: RankedTester = rankWith(
  ASSET_GALLERY_TESTER_RANK,
  (uischema, schema, context) => {
    if (!isControl(uischema)) return false;
    const scope = (uischema as ControlElement).scope;
    const formSchema = schema as JSONSchema7;
    const rootSchema =
      (context as { rootSchema?: JSONSchema7 }).rootSchema ?? formSchema;
    const atScope = propertySchemaAtScope(formSchema, scope, rootSchema);
    if (
      !atScope ||
      typeof atScope !== "object" ||
      Array.isArray(atScope) ||
      (atScope as JSONSchema7).type !== "array"
    ) {
      return false;
    }
    return assetKindForScope(context, formSchema, scope) !== undefined;
  },
);
