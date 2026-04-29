import type { JSONSchema7 } from "json-schema";
import type { RankedTester, UISchemaElement } from "@jsonforms/core";
import type React from "react";

/** Per-node context for dispatch and JSON Forms–style testers. */
export interface DetailTesterContext {
  rootSchema: JSONSchema7;
  depth: number;
  maxDepth: number;
  typeIRI?: string;
  typeName?: string;
  typeIRIToTypeName?: (iri: string) => string | undefined;
  /** TopLevelLayout header — typically derived from adb `primaryFields` + entity data */
  headerPreview?: {
    label: string | null;
    description: string | null;
    image: string | null;
  } | null;
  entityIRI?: string;
  humanLabel?: string;
  isLoading?: boolean;
  hideLinkedDataProperties?: boolean;
  linkedDataPropertyNames?: string[];
  hideHeaderPrimaryFields?: boolean;
  hiddenPropertyNames?: string[];
  alwaysShowPropertyNames?: string[];
  headerPrimaryFieldNames?: string[];
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

export interface DetailViewConfig {
  maxDepth?: number;
  extraRenderers?: DetailRendererRegistryEntry[];
  overrideRenderers?: DetailRendererRegistryEntry[];
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
