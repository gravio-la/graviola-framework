import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { GenerateDefaultDetailUISchemaOptions } from "@graviola/edb-detail-renderer";
import type { GenerateUISchemaOptions } from "@graviola/edb-ui-utils";
import type { UISchemaElement } from "@jsonforms/core";
import type { MetaStampingConfig } from "@graviola/meta-schema";
import type { TableUiSchema } from "@graviola/edb-table-types";
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
export type AnnotationDetailUiSchemaScopeOverrides = Record<
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
  /** Per-type annotation detail UI (meta profile fragment, not domain entity). */
  annotationDetailUiSchemata?: Record<string, UISchemaElement>;
  /** Meta profile schema used to generate annotation detail UI schemata. */
  annotationMetaSchema?: JSONSchema7;
  /** Extended schema with grafted `$meta` for reads/tables (domain schema stays in `schema`). */
  extendedSchema?: JSONSchema7;
  /** Opt-in `$meta` stamping configuration. */
  metaStamping?: MetaStampingConfig;
  /** Optional SemanticTable column overrides (e.g. hidden lifecycle columns). */
  tableUiSchema?: TableUiSchema;
};

export type OverridableSchemaConfig = SchemaConfig & {
  uischemaScopeOverrides?: FormUiSchemaScopeOverrides;
  detailUiSchemaScopeOverrides?: DetailUiSchemaScopeOverrides;
  annotationDetailUiSchemaScopeOverrides?: AnnotationDetailUiSchemaScopeOverrides;
};
