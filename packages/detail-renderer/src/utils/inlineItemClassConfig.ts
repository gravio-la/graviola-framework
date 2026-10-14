import type { ControlElement, UISchemaElement } from "@jsonforms/core";
import { definitionNameFromRef } from "@graviola/json-schema-utils";
import { orderSpecsFromUiSchema } from "@graviola/edb-core-utils";
import type { OrderByConfig } from "@graviola/edb-core-types";
import type { GenerateDefaultDetailUISchemaOptions } from "@graviola/edb-detail-renderer-core";
import type { JSONSchema7 } from "json-schema";

const TOP_LEVEL_PROPERTY_SCOPE = /^#\/properties\/([^/]+)$/;

type ControlWithRank = ControlElement & { rank?: number };

export function definitionNameFromItemSchema(
  itemSchema: JSONSchema7,
): string | undefined {
  if (typeof itemSchema.$ref === "string") {
    return definitionNameFromRef(itemSchema.$ref);
  }
  return undefined;
}

/** Collect `#/properties/*` control overrides from a generated detail UISchema tree. */
export function scopeOverridesFromDetailUiSchema(
  root: UISchemaElement | undefined,
): Record<string, Partial<ControlElement>> {
  const out: Record<string, Partial<ControlElement>> = {};
  if (!root) return out;

  const walk = (node: UISchemaElement): void => {
    if (node.type !== "Control") {
      const elements = (node as { elements?: UISchemaElement[] }).elements;
      if (elements) {
        for (const child of elements) walk(child);
      }
      return;
    }
    const ctrlEl = node as ControlElement;
    if (typeof ctrlEl.scope === "string") {
      if (TOP_LEVEL_PROPERTY_SCOPE.test(ctrlEl.scope)) {
        const ctrl = ctrlEl as ControlWithRank;
        const partial: Partial<ControlElement> & { rank?: number } = {};
        if (ctrl.label !== undefined) partial.label = ctrl.label;
        if (ctrl.options !== undefined) partial.options = ctrl.options;
        if (typeof ctrl.rank === "number") partial.rank = ctrl.rank;
        if (Object.keys(partial).length > 0) {
          out[ctrlEl.scope] = partial;
        }
      }
    }
  };

  walk(root);
  return out;
}

export function classLevelInlineGenerateOptions(
  itemSchema: JSONSchema7,
  detailUiSchemata: Record<string, UISchemaElement> | undefined,
  orderByConfig: OrderByConfig | undefined,
):
  | Pick<GenerateDefaultDetailUISchemaOptions, "scopeOverride" | "orderBy">
  | undefined {
  const defName = definitionNameFromItemSchema(itemSchema);
  if (!defName) return undefined;

  const uiRoot = detailUiSchemata?.[defName];
  const scopeOverride = scopeOverridesFromDetailUiSchema(uiRoot);
  const orderFromUi = orderSpecsFromUiSchema(
    uiRoot as Parameters<typeof orderSpecsFromUiSchema>[0],
  );
  const orderFromSide = orderByConfig?.[defName];
  const orderBy = {
    ...orderFromUi,
    ...(orderFromSide ?? {}),
  };

  const hasScope = Object.keys(scopeOverride).length > 0;
  const hasOrder = Object.keys(orderBy).length > 0;
  if (!hasScope && !hasOrder) return undefined;

  return {
    ...(hasScope ? { scopeOverride } : {}),
    ...(hasOrder ? { orderBy } : {}),
  };
}

export type InlinePresentationGenerateOptions = Pick<
  GenerateDefaultDetailUISchemaOptions,
  "skipScope" | "scopeOverride" | "layoutType"
>;

export function mergeInlineItemGenerateOptions(
  classLevel:
    | Pick<GenerateDefaultDetailUISchemaOptions, "scopeOverride" | "orderBy">
    | undefined,
  presentation: InlinePresentationGenerateOptions | undefined,
): InlinePresentationGenerateOptions & {
  orderBy?: GenerateDefaultDetailUISchemaOptions["orderBy"];
} {
  const scopeKeys = new Set([
    ...Object.keys(classLevel?.scopeOverride ?? {}),
    ...Object.keys(presentation?.scopeOverride ?? {}),
  ]);
  const scopeOverride: NonNullable<
    GenerateDefaultDetailUISchemaOptions["scopeOverride"]
  > = {};
  for (const scope of scopeKeys) {
    scopeOverride[scope] = {
      ...(classLevel?.scopeOverride?.[scope] ?? {}),
      ...(presentation?.scopeOverride?.[scope] ?? {}),
    };
  }
  const skipScope = presentation?.skipScope;
  const layoutType = presentation?.layoutType;
  const orderBy = classLevel?.orderBy;

  const out: InlinePresentationGenerateOptions & {
    orderBy?: GenerateDefaultDetailUISchemaOptions["orderBy"];
  } = {};

  if (skipScope?.length) out.skipScope = skipScope;
  if (layoutType) out.layoutType = layoutType;
  if (Object.keys(scopeOverride).length > 0) out.scopeOverride = scopeOverride;
  if (orderBy && Object.keys(orderBy).length > 0) out.orderBy = orderBy;

  return out;
}
