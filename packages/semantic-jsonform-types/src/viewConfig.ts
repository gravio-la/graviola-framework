import type { RankedTester, UISchemaElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import type React from "react";

import type {
  CardPresentation,
  TypePresentationRegistry,
} from "@graviola/edb-core-types";
import type { ValueRendererEntry } from "@graviola/edb-detail-renderer-core";

export type ViewSize = "chip" | "listItem" | "card" | "detail";
export type ViewContext = "modal" | "page";

export interface ViewRendererRegistryEntry {
  tester: RankedTester;
  renderer: React.ComponentType<Record<string, unknown>>;
}

export interface GenerateDefaultViewUISchemaOptions {
  skipScope?: string[];
  scopeOverride?: Record<
    string,
    Partial<{ label?: string; options?: Record<string, unknown> }>
  >;
  layoutType?: string;
  prefix?: string;
  rootSchema?: JSONSchema7;
  /** Merged into generated `CardLayout` options when view size is `card`. */
  cardPresentation?: CardPresentation;
}

/** Card-specific options on {@link ViewConfig.options} (merged with `cardPresentation` registry). */
export interface CardViewConfigOptions {
  cardPresentation?: CardPresentation;
  /** Fired for `custom` card actions and optional telemetry. */
  onCardAction?: (
    actionId: string,
    ctx: {
      entityIRI?: string;
      typeIRI?: string;
      typeName?: string;
      data: unknown;
    },
  ) => void;
}

export interface ViewConfig {
  extraRenderers?: ViewRendererRegistryEntry[];
  overrideRenderers?: ViewRendererRegistryEntry[];
  valueRenderers?: ValueRendererEntry[];
  overrideValueRenderers?: ValueRendererEntry[];
  uiSchemata?: Record<string, UISchemaElement>;
  uiSchemataByTypeIRI?: Record<string, UISchemaElement>;
  typeNameOverrides?: Record<string, Partial<ViewConfig>>;
  typeIRIOverrides?: Record<string, Partial<ViewConfig>>;
  defaultGenerationOptions?: GenerateDefaultViewUISchemaOptions;
  options?: Record<string, unknown> & CardViewConfigOptions;
}

export interface ViewConfigSet {
  chip?: ViewConfig;
  listItem?: ViewConfig;
  card?: ViewConfig;
  detail?: ViewConfig;
}

/** @deprecated Use `viewConfig.detail.options` instead. */
export type DetailViewConfigOptions = {
  hideLinkedDataProperties?: boolean;
  linkedDataPropertyNames?: string[];
  hideHeaderPrimaryFields?: boolean;
  hiddenPropertyNames?: string[];
  alwaysShowPropertyNames?: string[];
};

/** @deprecated Types-only package — implement at call site or in a runtime package. */
export type ResolveViewConfigFn = (
  viewConfig: ViewConfigSet | undefined,
  size: ViewSize,
  legacyDetailOptions?: DetailViewConfigOptions,
) => ViewConfig | undefined;
