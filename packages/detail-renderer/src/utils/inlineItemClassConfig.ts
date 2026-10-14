import type { ControlElement, UISchemaElement } from "@jsonforms/core";
import { definitionNameFromRef } from "@graviola/json-schema-utils";
import { orderSpecsFromUiSchema } from "@graviola/edb-core-utils";
import type { OrderByConfig } from "@graviola/edb-core-types";
import type { GenerateDefaultDetailUISchemaOptions } from "@graviola/edb-detail-renderer-core";
import type { JSONSchema7 } from "json-schema";

const TOP_LEVEL_PROPERTY_SCOPE = /^#\/properties\/([^/]+)$/;

type ControlWithRank = ControlElement & { rank?: number };

export type ItemSchemaDefinitionLookup = {
  rootSchema?: JSONSchema7;
  /** Dereferenced item schema (for `@type` const and property matching). */
  resolvedItemSchema?: JSONSchema7;
  typeIRIToTypeName?: (typeIRI: string) => string | undefined;
};

function typeConstFromObjectSchema(
  schema: JSONSchema7 | undefined,
): string | undefined {
  if (!schema?.properties) return undefined;
  const atType = schema.properties["@type"] as JSONSchema7 | undefined;
  if (!atType || typeof atType !== "object") return undefined;
  if (typeof atType.const === "string") return atType.const;
  if (
    atType.type === "string" &&
    Array.isArray(atType.enum) &&
    atType.enum.length === 1 &&
    typeof atType.enum[0] === "string"
  ) {
    return atType.enum[0];
  }
  return undefined;
}

function schemaPropertyKeys(schema: JSONSchema7): Set<string> {
  const props = schema.properties;
  if (!props || typeof props !== "object") return new Set();
  return new Set(Object.keys(props));
}

function definitionEntries(rootSchema: JSONSchema7): [string, JSONSchema7][] {
  const defs =
    rootSchema.definitions ??
    (rootSchema as { $defs?: Record<string, JSONSchema7> }).$defs;
  if (!defs || typeof defs !== "object") return [];
  return Object.entries(defs).map(([name, def]) => [name, def as JSONSchema7]);
}

function definitionNameBySchemaIdentity(
  rootSchema: JSONSchema7,
  itemSchema: JSONSchema7,
): string | undefined {
  const itemKeys = schemaPropertyKeys(itemSchema);
  if (itemKeys.size === 0) return undefined;
  const itemTypeConst = typeConstFromObjectSchema(itemSchema);

  for (const [name, def] of definitionEntries(rootSchema)) {
    const defKeys = schemaPropertyKeys(def);
    if (defKeys.size !== itemKeys.size) continue;
    let keysMatch = true;
    for (const key of itemKeys) {
      if (!defKeys.has(key)) {
        keysMatch = false;
        break;
      }
    }
    if (!keysMatch) continue;
    if (itemTypeConst != null) {
      const defTypeConst = typeConstFromObjectSchema(def);
      if (defTypeConst !== itemTypeConst) continue;
    }
    return name;
  }
  return undefined;
}

export function definitionNameFromItemSchema(
  itemSchema: JSONSchema7,
  lookup?: ItemSchemaDefinitionLookup,
): string | undefined {
  if (typeof itemSchema.$ref === "string") {
    return definitionNameFromRef(itemSchema.$ref);
  }

  const resolved = lookup?.resolvedItemSchema ?? itemSchema;
  const typeIRI = typeConstFromObjectSchema(resolved);
  if (typeIRI && lookup?.typeIRIToTypeName) {
    const fromIri = lookup.typeIRIToTypeName(typeIRI);
    if (fromIri) return fromIri;
  }

  if (lookup?.rootSchema) {
    return definitionNameBySchemaIdentity(lookup.rootSchema, resolved);
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
  lookup?: ItemSchemaDefinitionLookup,
):
  | Pick<GenerateDefaultDetailUISchemaOptions, "scopeOverride" | "orderBy">
  | undefined {
  const defName = definitionNameFromItemSchema(itemSchema, lookup);
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
