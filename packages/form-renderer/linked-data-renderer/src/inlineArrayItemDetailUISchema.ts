import { generateDefaultUISchema } from "@graviola/edb-ui-utils";
import {
  findUISchema,
  Generate,
  isLayout,
  JsonSchema,
  Layout,
  Resolve,
  Scopable,
  UISchemaElement,
} from "@jsonforms/core";
import type {
  ControlElement,
  JsonFormsUISchemaRegistryEntry,
} from "@jsonforms/core";
import type { OrderByConfig } from "@graviola/semantic-jsonform-types";
import merge from "lodash-es/merge";

const DEFAULT_SKIP_ITEM_SCOPES = ["#/properties/@id", "#/properties/@type"];

/** JSON Forms array layouts pass the item schema as `schema`; legacy callers may pass the array schema. */
export function resolveInlineArrayItemSchema(
  schemaOrArray: JsonSchema,
  rootSchema: JsonSchema,
): JsonSchema | undefined {
  if (schemaOrArray.type === "array") {
    const resolved = Resolve.schema(schemaOrArray, "items", rootSchema);
    return typeof resolved === "boolean" ? undefined : resolved;
  }
  return schemaOrArray;
}

function layoutHasControls(uischema: UISchemaElement | undefined): boolean {
  if (!uischema || !isLayout(uischema)) return false;
  return (uischema as Layout).elements?.length > 0;
}

function stripLeadingAtIdControl(layout: Layout): Layout {
  const elements = layout.elements as Scopable[] | undefined;
  if (elements?.[0]?.scope === "#/properties/@id") {
    return { ...layout, elements: elements.slice(1) };
  }
  return layout;
}

function filterSkipScopes(layout: Layout, skipScope: string[]): Layout {
  const elements = (layout.elements ?? []).filter((el) => {
    const scope = (el as Scopable).scope;
    return !scope || !skipScope.includes(scope);
  });
  return { ...layout, elements };
}

type FormScopeOverrideEntry = {
  mode?: "override" | "exclusive";
  scopeOverride?: Record<string, ControlElement>;
};

type InlineArrayJsonFormsConfig = {
  uischemata?: Record<string, UISchemaElement>;
  uischemaScopeOverrides?: Record<string, FormScopeOverrideEntry>;
  orderBy?: OrderByConfig;
  typeIRIToTypeName?: (typeIRI: string) => string;
  formScopeOverride?: Record<string, ControlElement>;
};

function resolveItemTypeName(
  itemSchema: JsonSchema,
  config?: InlineArrayJsonFormsConfig,
): string | undefined {
  const typeIRI = itemSchema.properties?.["@type"]?.const;
  if (typeof typeIRI !== "string" || typeIRI.length === 0) return undefined;
  if (config?.typeIRIToTypeName) {
    return config.typeIRIToTypeName(typeIRI);
  }
  return typeIRI.split(/[#/]/).filter(Boolean).pop();
}

export type ResolveInlineArrayItemDetailUISchemaParams = {
  arraySchema: JsonSchema;
  arrayControl: ControlElement;
  rootSchema: JsonSchema;
  path: string;
  uischemas?: JsonFormsUISchemaRegistryEntry[];
  config?: Record<string, unknown>;
};

/** Detail layout for one expanded inline array row (item fields, not array chrome). */
export function resolveInlineArrayItemDetailUISchema(
  params: ResolveInlineArrayItemDetailUISchemaParams,
): UISchemaElement {
  const { arraySchema, arrayControl, rootSchema, path, uischemas, config } =
    params;
  const formConfig = config as InlineArrayJsonFormsConfig | undefined;
  const appliedOptions = merge({}, config, arrayControl.options);
  const explicitDetail = appliedOptions.detail as UISchemaElement | undefined;
  if (layoutHasControls(explicitDetail)) {
    return explicitDetail as UISchemaElement;
  }

  const itemSchema = resolveInlineArrayItemSchema(arraySchema, rootSchema);
  if (!itemSchema) {
    if (layoutHasControls(explicitDetail)) {
      return explicitDetail as UISchemaElement;
    }
    return { type: "VerticalLayout", elements: [] };
  }

  const itemTypeName = resolveItemTypeName(itemSchema, formConfig);
  const classFormOpts =
    itemTypeName && formConfig?.uischemaScopeOverrides?.[itemTypeName];

  const itemScopeOverride =
    (appliedOptions.itemScopeOverride as Record<string, ControlElement>) ??
    (formConfig?.formScopeOverride as
      | Record<string, ControlElement>
      | undefined);

  const mergedScopeOverride = merge(
    {},
    classFormOpts?.scopeOverride,
    itemScopeOverride,
  );
  const hasMergedScopeOverride =
    mergedScopeOverride && Object.keys(mergedScopeOverride).length > 0;

  const skipScope = [
    ...DEFAULT_SKIP_ITEM_SCOPES,
    ...((appliedOptions.itemSkipScope as string[] | undefined) ?? []),
  ];

  const generateItemLayout = () =>
    generateDefaultUISchema(itemSchema, {
      rootSchema,
      skipScope,
      scopeOverride: hasMergedScopeOverride ? mergedScopeOverride : undefined,
      mode:
        classFormOpts?.mode ??
        (appliedOptions.itemScopeOverrideMode as
          | "override"
          | "exclusive"
          | undefined) ??
        "override",
      orderBy: itemTypeName ? formConfig?.orderBy?.[itemTypeName] : undefined,
    });

  if (
    itemTypeName &&
    formConfig?.uischemata?.[itemTypeName] &&
    !itemScopeOverride
  ) {
    const classUi = formConfig.uischemata[itemTypeName];
    if (isLayout(classUi) && layoutHasControls(classUi)) {
      return filterSkipScopes(
        stripLeadingAtIdControl(classUi as Layout),
        skipScope,
      );
    }
  }

  if (hasMergedScopeOverride) {
    const generated = generateItemLayout();
    if (layoutHasControls(generated)) {
      return generated as UISchemaElement;
    }
  }

  const itemIsEntityLike =
    typeof itemSchema.properties?.["@id"] !== "undefined";

  if (itemIsEntityLike && uischemas?.length) {
    const fromRegistry = findUISchema(
      uischemas,
      itemSchema,
      arrayControl.scope,
      path,
      generateItemLayout,
      arrayControl,
      rootSchema,
    ) as Layout | undefined;

    if (fromRegistry && layoutHasControls(fromRegistry)) {
      return stripLeadingAtIdControl(fromRegistry);
    }
  }

  const generated = generateItemLayout();
  if (layoutHasControls(generated)) {
    return generated as UISchemaElement;
  }

  const fallback = Generate.uiSchema(itemSchema, "VerticalLayout") as Layout;
  if (layoutHasControls(fallback)) {
    return fallback;
  }

  if (layoutHasControls(explicitDetail)) {
    return explicitDetail as UISchemaElement;
  }

  return fallback;
}
