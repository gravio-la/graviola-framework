import type { EntityPreview } from "@graviola/edb-core-types";
import type { SchemaScopeFrame } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import type { RankedTester, UISchemaElement } from "@jsonforms/core";
import type React from "react";

export type ViewSize = "chip" | "listItem" | "card" | "detail";

/**
 * How {@link TopLevelLayoutRenderer} orders the hero (primary fields) vs. nested property controls.
 *
 * - `default` — hero card (image, title, description) first, then a divider, then property rows.
 * - `singleCardPropertiesFirst` — one unified card: full-bleed hero image with rounded top (flush to
 *   the dialog/card edge), then headline, subtitle, divider, then property rows.
 */
export type DetailTopLevelLayoutVariant =
  | "default"
  | "singleCardPropertiesFirst";

/** Per-node context for dispatch and JSON Forms–style testers. */
export interface DetailTesterContext {
  rootSchema: JSONSchema7;
  depth: number;
  maxDepth: number;
  viewSize?: ViewSize;
  frame?: SchemaScopeFrame;
  typeIRI?: string;
  typeName?: string;
  typeIRIToTypeName?: (iri: string) => string | undefined;
  /** @deprecated Use {@link preview} */
  headerPreview?: {
    label: string | null;
    description: string | null;
    image: string | null;
  } | null;
  preview?: EntityPreview | null;
  entityIRI?: string;
  humanLabel?: string;
  isLoading?: boolean;
  hideLinkedDataProperties?: boolean;
  linkedDataPropertyNames?: string[];
  hideHeaderPrimaryFields?: boolean;
  hiddenPropertyNames?: string[];
  alwaysShowPropertyNames?: string[];
  headerPrimaryFieldNames?: string[];
  /** Inherited from merged {@link DetailViewConfig}; drives {@link TopLevelLayoutRenderer}. */
  topLevelLayoutVariant?: DetailTopLevelLayoutVariant;
  /** Merged registry used by leaf renderers for inline value formatting. */
  valueRenderers?: import("./value-renderers/types").ValueRendererEntry[];
}

export interface DetailRendererRegistryEntry {
  tester: RankedTester;
  renderer: React.ComponentType<DetailRendererProps>;
}

export interface DetailRendererProps {
  schema: JSONSchema7;
  data: unknown;
  path: string[];
  label: string;
  uiSchema: UISchemaElement;
  dispatch: DetailDispatch;
  rootSchema: JSONSchema7;
  rootData: unknown;
  ctx: DetailTesterContext;
  /**
   * Pick a concrete renderer for an alternate schema (anyOf/oneOf branches) without
   * changing the UISchema Control scope.
   */
  resolveRenderer?: (schema: JSONSchema7) => React.ReactNode;
}

export type DetailDispatch = (params: {
  uiSchema: UISchemaElement;
  ctx?: DetailTesterContext;
}) => React.ReactNode;

/**
 * JSON Forms `ControlElement.options.detailArrayInline` — presentation hints for arrays
 * rendered by compact inline-object layouts (typically `ArrayInlineObjectRenderer`).
 */
export interface DetailArrayInlineControlOptions {
  /** Omit per-item borders / extra spacing */
  compactItems?: boolean;
  /** Arrange items horizontally (row) like chips, or vertically (column). */
  itemLayout?: "column" | "row";
  /** If set, omit all other JSON properties on each item schema root when generating item UI */
  itemIncludeProperties?: string[];
  /** Use empty JsonForms labels on rendered item leaf controls */
  hidePropertyLabels?: boolean;
}

export const DETAIL_ARRAY_INLINE_OPTIONS_KEY = "detailArrayInline" as const;

export interface DetailViewConfig {
  maxDepth?: number;
  extraRenderers?: DetailRendererRegistryEntry[];
  /** Lowest-priority entries appended after the size defaults (e.g. AllPropsTable). */
  fallbackRenderers?: DetailRendererRegistryEntry[];
  overrideRenderers?: DetailRendererRegistryEntry[];
  /** App value formatters; merged before framework defaults unless overridden. */
  valueRenderers?: import("./value-renderers/types").ValueRendererEntry[];
  /** Highest-priority value formatters (prepended to the merged registry). */
  overrideValueRenderers?: import("./value-renderers/types").ValueRendererEntry[];
  /** Per-type-name UISchema roots */
  uiSchemata?: Record<string, UISchemaElement>;
  /** Per-type-IRI UISchema roots */
  uiSchemataByTypeIRI?: Record<string, UISchemaElement>;
  typeIRIOverrides?: Record<string, Partial<DetailViewConfig>>;
  typeNameOverrides?: Record<string, Partial<DetailViewConfig>>;
  /** Typically `useAdbContext().typeIRIToTypeName` */
  typeIRIToTypeName?: (iri: string) => string | undefined;
  /** Typically adb `primaryFields` map — used by TopLevelLayout (binding) for header fields */
  primaryFields?: Record<string, unknown>;
  hideLinkedDataProperties?: boolean;
  linkedDataPropertyNames?: string[];
  hideHeaderPrimaryFields?: boolean;
  hiddenPropertyNames?: string[];
  alwaysShowPropertyNames?: string[];
  /** Top-level detail layout; default is `"default"`. */
  topLevelLayoutVariant?: DetailTopLevelLayoutVariant;
}

export interface ChipDefinition {
  label: (data: unknown, schema: JSONSchema7) => string | null;
  image?: (data: unknown, schema: JSONSchema7) => string | null | undefined;
  icon?: React.ComponentType<{ fontSize?: string }>;
  color?: (data: unknown, schema: JSONSchema7) => string | undefined;
  backgroundPattern?: (
    data: unknown,
    schema: JSONSchema7,
  ) => string | undefined;
  popoverContent?: React.ComponentType<{ data: unknown; schema: JSONSchema7 }>;
}

export interface ChipRendererProps {
  schema: JSONSchema7;
  data: unknown;
  path: string[];
  definition: ChipDefinition;
  onClick?: () => void;
  variant?: "chip" | "label";
}

export interface ChipRendererEntry {
  tester: RankedTester;
  computeDefinition: (
    schema: JSONSchema7,
    data: unknown,
    path: string[],
  ) => ChipDefinition;
  renderer: React.ComponentType<ChipRendererProps>;
}

export interface ChipsConfig {
  byTypeIRI?: Record<string, ChipRendererEntry | ChipDefinition>;
  registry?: ChipRendererEntry[];
}

export type { Tester } from "@jsonforms/core";
