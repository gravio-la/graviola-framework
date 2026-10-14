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
import isEmpty from "lodash-es/isEmpty";
import merge from "lodash-es/merge";

const DEFAULT_SKIP_ITEM_SCOPES = ["#/properties/@id", "#/properties/@type"];

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
  const appliedOptions = merge({}, config, arrayControl.options);
  const explicitDetail = appliedOptions.detail as UISchemaElement | undefined;
  if (layoutHasControls(explicitDetail)) {
    return explicitDetail as UISchemaElement;
  }

  const itemSchema = Resolve.schema(arraySchema, "items", rootSchema) as
    | JsonSchema
    | undefined;
  if (!itemSchema || typeof itemSchema === "boolean") {
    return explicitDetail ?? { type: "VerticalLayout", elements: [] };
  }

  const scopeOverride =
    (appliedOptions.itemScopeOverride as Record<string, ControlElement>) ??
    (config?.formScopeOverride as Record<string, ControlElement> | undefined);

  const skipScope = [
    ...DEFAULT_SKIP_ITEM_SCOPES,
    ...((appliedOptions.itemSkipScope as string[] | undefined) ?? []),
  ];

  const fromRegistry = findUISchema(
    uischemas,
    itemSchema,
    arrayControl.scope,
    path,
    () =>
      generateDefaultUISchema(itemSchema, {
        rootSchema,
        skipScope,
        scopeOverride,
      }),
    arrayControl,
    rootSchema,
  ) as Layout | undefined;

  if (fromRegistry && layoutHasControls(fromRegistry)) {
    return stripLeadingAtIdControl(fromRegistry);
  }

  const generated = generateDefaultUISchema(itemSchema, {
    rootSchema,
    skipScope,
    scopeOverride,
  });
  if (layoutHasControls(generated)) {
    return stripLeadingAtIdControl(generated as Layout);
  }

  if (!isEmpty(path)) {
    const fallback = Generate.uiSchema(itemSchema, "VerticalLayout") as Layout;
    return stripLeadingAtIdControl(fallback);
  }

  return { type: "VerticalLayout", elements: [] };
}
