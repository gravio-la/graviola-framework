import type { CardPresentation } from "@graviola/edb-core-types";
import type { ControlElement, Layout } from "@jsonforms/core";
function humanizeFieldName(fieldName: string): string {
  return fieldName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}
import type { JSONSchema7 } from "json-schema";

export type CardLayoutUiSchema = Layout & {
  options?: {
    cardPresentation?: CardPresentation;
  };
};

export function readCardPresentation(
  uiSchema: CardLayoutUiSchema,
  configPresentation?: CardPresentation,
): CardPresentation {
  return {
    ...configPresentation,
    ...uiSchema.options?.cardPresentation,
  };
}

export function readPropertyValue(
  data: unknown,
  propName: string | undefined,
): unknown {
  if (!propName || data == null || typeof data !== "object") return undefined;
  return (data as Record<string, unknown>)[propName];
}

export function readPropertyString(
  data: unknown,
  propName: string | undefined,
): string | undefined {
  const val = readPropertyValue(data, propName);
  if (typeof val === "string") return val;
  if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  return undefined;
}

export function formatStatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "number") {
    if (value >= 1000) return `${Math.round(value / 100) / 10}K`;
    return String(value);
  }
  return String(value);
}

export function isSecondaryControl(el: unknown): boolean {
  if (!el || typeof el !== "object") return false;
  const control = el as ControlElement;
  if (control.type !== "Control") return false;
  const slot = (control.options as { slot?: string } | undefined)?.slot;
  return slot === "secondary";
}

export function secondaryFieldNamesFromPresentation(
  presentation: CardPresentation,
  schema: JSONSchema7,
): string[] {
  if (presentation.secondaryFields?.length) {
    return presentation.secondaryFields;
  }
  const props = schema.properties ?? {};
  return Object.keys(props).slice(0, presentation.secondaryFieldLimit ?? 3);
}

export function statLabelForField(
  schema: JSONSchema7,
  fieldName: string,
): string {
  const prop = schema.properties?.[fieldName] as JSONSchema7 | undefined;
  return (prop?.title as string | undefined) ?? humanizeFieldName(fieldName);
}

export const CARD_SIZE_TOKENS = {
  compact: {
    contentPy: 1.25,
    contentPx: 1.5,
    titleVariant: "subtitle1" as const,
    subVariant: "caption" as const,
    actionPy: 0.5,
    borderRadius: 12,
  },
  standard: {
    contentPy: 2,
    contentPx: 2,
    titleVariant: "h6" as const,
    subVariant: "body2" as const,
    actionPy: 1,
    borderRadius: 16,
  },
  comfortable: {
    contentPy: 2.5,
    contentPx: 2.5,
    titleVariant: "h5" as const,
    subVariant: "body2" as const,
    actionPy: 1.25,
    borderRadius: 20,
  },
};
