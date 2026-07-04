import type { CardPresentation, PrimaryField } from "@graviola/edb-core-types";
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
import { inferSecondaryFields } from "./inferSecondaryFields";

export type GenerateDefaultCardUISchemaOptions =
  GenerateDefaultDetailUISchemaOptions & {
    cardPresentation?: CardPresentation;
  };

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
  extraElements: UISchemaElement[] = [],
  layoutOptions?: Record<string, unknown>,
): UISchemaElement {
  const elements: UISchemaElement[] = [];
  const label = slotControl(primary?.label, "label", opts);
  const image = slotControl(primary?.image, "image", opts);
  const description = slotControl(primary?.description, "description", opts);
  if (image) elements.push(image);
  if (label) elements.push(label);
  if (description) elements.push(description);
  elements.push(...extraElements);

  const layout: UISchemaElement = {
    type: layoutType,
    elements,
  } as UISchemaElement;

  if (layoutOptions && Object.keys(layoutOptions).length > 0) {
    (layout as { options?: Record<string, unknown> }).options = layoutOptions;
  }

  return layout;
}

function secondaryControls(
  schema: JsonSchema,
  primary: PrimaryField | undefined,
  cardPresentation: CardPresentation | undefined,
  opts?: GenerateDefaultDetailUISchemaOptions,
): ControlElement[] {
  const rootSchema = opts?.rootSchema ?? schema;
  const limit = cardPresentation?.secondaryFieldLimit ?? 3;
  const fieldNames = inferSecondaryFields(
    schema,
    primary,
    limit,
    cardPresentation?.secondaryFields,
    rootSchema,
    cardPresentation?.banner ? [cardPresentation.banner] : [],
  );

  const hideLabels = cardPresentation?.hidePropertyLabels ?? false;

  return fieldNames
    .map((prop) => {
      const scope = `#/properties/${encode(prop)}`;
      return createControlElement(scope, {
        ...opts,
        scopeOverride: {
          ...(opts?.scopeOverride ?? {}),
          [scope]: {
            ...(opts?.scopeOverride?.[scope] ?? {}),
            ...(hideLabels ? { label: "" } : {}),
            options: {
              ...((opts?.scopeOverride?.[scope] as ControlElement)?.options ??
                {}),
              slot: "secondary",
            },
          },
        },
      });
    })
    .filter(Boolean) as ControlElement[];
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
  opts?: GenerateDefaultCardUISchemaOptions,
): UISchemaElement {
  const { cardPresentation, ...restOpts } = opts ?? {};
  const secondary = secondaryControls(
    schema,
    primary,
    cardPresentation,
    restOpts,
  );
  const layoutOptions = cardPresentation ? { cardPresentation } : undefined;

  return layoutWithPrimary(
    "CardLayout",
    primary,
    restOpts,
    secondary,
    layoutOptions,
  );
}

export function generateDefaultViewUISchema(
  viewSize: import("../types").ViewSize,
  schema: JsonSchema,
  primary?: PrimaryField,
  opts?: GenerateDefaultCardUISchemaOptions,
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
