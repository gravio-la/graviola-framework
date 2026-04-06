import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { UISchemaElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import type { FC } from "react";

/** Matches `SchemaDefinitionConfig.icon` in `@graviola/edb-advanced-components` sidebar types. */
export type SchemaIcon = string | FC<{ stroke: number; size: string }>;

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
};
