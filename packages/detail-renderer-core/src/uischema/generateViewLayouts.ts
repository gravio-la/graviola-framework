import type { PrimaryField } from "@graviola/edb-core-types";
import type {
  ControlElement,
  JsonSchema,
  UISchemaElement,
} from "@jsonforms/core";
import { encode } from "@jsonforms/core";

import {
  createControlElement,
  type GenerateDefaultDetailUISchemaOptions,
  generateDefaultDetailUISchema,
} from "./generateDefault";

function slotControl(
  prop: string | undefined,
  slot: string,
  opts?: GenerateDefaultDetailUISchemaOptions,
): ControlElement | null {
  if (!prop) return null;
  const scope = `#/properties/${encode(prop)}`;
  return createControlElement(scope, {
    ...opts,
    scopeOverride: {
      ...(opts?.scopeOverride ?? {}),
      [scope]: {
        ...(opts?.scopeOverride?.[scope] ?? {}),
        options: {
          ...((opts?.scopeOverride?.[scope] as ControlElement)?.options ?? {}),
          slot,
        },
      },
    },
  });
}

function layoutWithPrimary(
  layoutType: string,
  primary: PrimaryField | undefined,
  opts?: GenerateDefaultDetailUISchemaOptions,
): UISchemaElement {
  const elements: UISchemaElement[] = [];
  const label = slotControl(primary?.label, "label", opts);
  const image = slotControl(primary?.image, "image", opts);
  const description = slotControl(primary?.description, "description", opts);
  if (image) elements.push(image);
  if (label) elements.push(label);
  if (description) elements.push(description);
  return { type: layoutType, elements } as UISchemaElement;
}

export function generateDefaultChipUISchema(
  schema: JsonSchema,
  primary?: PrimaryField,
  opts?: GenerateDefaultDetailUISchemaOptions,
): UISchemaElement {
  return layoutWithPrimary("ChipLayout", primary, opts);
}

export function generateDefaultListItemUISchema(
  schema: JsonSchema,
  primary?: PrimaryField,
  opts?: GenerateDefaultDetailUISchemaOptions,
): UISchemaElement {
  return layoutWithPrimary("ListItemLayout", primary, opts);
}

export function generateDefaultCardUISchema(
  schema: JsonSchema,
  primary?: PrimaryField,
  opts?: GenerateDefaultDetailUISchemaOptions,
): UISchemaElement {
  return layoutWithPrimary("CardLayout", primary, opts);
}

export function generateDefaultViewUISchema(
  viewSize: import("../types").ViewSize,
  schema: JsonSchema,
  primary?: PrimaryField,
  opts?: GenerateDefaultDetailUISchemaOptions,
): UISchemaElement {
  switch (viewSize) {
    case "chip":
      return generateDefaultChipUISchema(schema, primary, opts);
    case "listItem":
      return generateDefaultListItemUISchema(schema, primary, opts);
    case "card":
      return generateDefaultCardUISchema(schema, primary, opts);
    case "detail":
    default:
      return generateDefaultDetailUISchema(schema, {
        layoutType: "TopLevelLayout",
        ...opts,
      });
  }
}
