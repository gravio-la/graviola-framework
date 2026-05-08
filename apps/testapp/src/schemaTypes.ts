import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { GenerateDefaultDetailUISchemaOptions } from "@graviola/edb-detail-renderer";
import type { GenerateUISchemaOptions } from "@graviola/edb-ui-utils";
import type { UISchemaElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import type { FC } from "react";

/** Matches `SchemaDefinitionConfig.icon` in `@graviola/edb-advanced-components` sidebar types. */
export type SchemaIcon = string | FC<{ stroke: number; size: string }>;

/** Per-typeName options passed to `generateDefaultUISchema` (via `makeSchemaConfig`). */
export type FormUiSchemaScopeOverrides = Record<
  string,
  GenerateUISchemaOptions
>;
export type DetailUiSchemaScopeOverrides = Record<
  string,
  GenerateDefaultDetailUISchemaOptions
>;

/**
 * Pure data config for a testapp schema (no JSX). Routes live in `*-schema-routes.tsx`.
 */
export type SchemaConfig = {
  schemaName: string;
  label: string;
  description: string;
  version: string;
  cardImage?: string;
  color?: string;
  icon?: SchemaIcon;
  storageKey: string;
  initialData?: string;
  baseIRI: string;
  entityBaseIRI: string;
  schema: JSONSchema7;
  primaryFields: PrimaryFieldDeclaration;
  typeNameLabelMap: Record<string, string>;
  typeNameUiSchemaOptionsMap: Record<string, unknown>;
  uischemata?: Record<string, UISchemaElement>;
  /** Per-typeName UISchema roots for the schema-driven detail view (JSON Forms shape) */
  detailUiSchemata?: Record<string, UISchemaElement>;
};

export type OverridableSchemaConfig = SchemaConfig & {
  uischemaScopeOverrides?: FormUiSchemaScopeOverrides;
  detailUiSchemaScopeOverrides?: DetailUiSchemaScopeOverrides;
};
