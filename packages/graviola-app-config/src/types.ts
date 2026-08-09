import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { GenerateDefaultDetailUISchemaOptions } from "@graviola/edb-detail-renderer";
import type { GenerateUISchemaOptions } from "@graviola/edb-ui-utils";
import type {
  MenuUISchema,
  SidebarConfig,
} from "@graviola/edb-advanced-components";
import type { TableUiSchema } from "@graviola/edb-table-types";
import type { CompiledProfile } from "@graviola/formula-dependency";
import type { SearchFacetSchema } from "@graviola/search-facet-schema";
import type { UISchemaElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import type { FC } from "react";

/**
 * String emoji or React component icon. Mirrors the icon shape used by
 * `@graviola/edb-advanced-components` sidebar types.
 */
export type SchemaIcon = string | FC<{ stroke: number; size: string }>;

/** Per-typeName options passed to `generateDefaultUISchema`. */
export type FormUiSchemaScopeOverrides = Record<
  string,
  GenerateUISchemaOptions
>;

/** Per-typeName options passed to `generateDefaultDetailUISchema`. */
export type DetailUiSchemaScopeOverrides = Record<
  string,
  GenerateDefaultDetailUISchemaOptions
>;

/**
 * Fully-resolved, ready-to-use schema configuration for a Graviola-driven app.
 *
 * Forms, tables, detail views and CRUD all derive from this single object.
 * The companion `OverridableSchemaConfig` type adds ergonomic fields
 * (`uischemaScopeOverrides`, `detailUiSchemaScopeOverrides`, …) which
 * `defineGraviolaApp` / `schemaConfigFromSidecars` compile into resolved maps.
 */
export type SchemaConfig = {
  /** Stable machine-readable name (used in routes, persistence keys, etc.). */
  schemaName: string;
  /** Human-readable label shown to end users. */
  label: string;
  /** Short description shown on landing pages or in tooltips. */
  description: string;
  /** Schema version (independent of package version). */
  version: string;
  /** Optional card image URL for landing-page tiles. */
  cardImage?: string;
  /** Optional accent color for the schema. */
  color?: string;
  /** Optional icon (emoji string or React component). */
  icon?: SchemaIcon;
  /** Local-storage key namespace for the in-browser store. */
  storageKey: string;
  /** Optional initial data string (Turtle / JSON-LD) seeded into the store on first run. */
  initialData?: string;
  /** Base IRI for the application (typeName -> `${baseIRI}${typeName}` by default). */
  baseIRI: string;
  /** Base IRI used when minting new entity IRIs. */
  entityBaseIRI: string;
  /** The JSON Schema definition document with `definitions` map. */
  schema: JSONSchema7;
  /** Primary-field declarations (label/description/image) per typeName. */
  primaryFields: PrimaryFieldDeclaration;
  /** Display labels per typeName (e.g. "Item" -> "Artikel"). */
  typeNameLabelMap: Record<string, string>;
  /** Additional UI-schema options merged into the auto-generated stub controls per typeName. */
  typeNameUiSchemaOptionsMap: Record<string, unknown>;
  /** Optional pre-built UISchemaElement roots used for editing forms. */
  uischemata?: Record<string, UISchemaElement>;
  /** Optional pre-built UISchemaElement roots used for the schema-driven detail view. */
  detailUiSchemata?: Record<string, UISchemaElement>;
  /** Optional per-typeName table UI schemas. */
  tableUiSchemaByType?: Record<string, TableUiSchema>;
  /** Optional single table UI schema (legacy / shared). */
  tableUiSchema?: TableUiSchema;
  /** Sidebar menu entries per definition key. */
  menuUISchema?: MenuUISchema;
  /** Sidebar prioritization / hidden definitions. */
  menuSidebarConfig?: SidebarConfig;
  /** Compiled calculated-fields profile (from calc-profile sidecar). */
  calcProfile?: CompiledProfile;
  /** Full-text / facet sidecar (from search-facet sidecar). */
  searchFacetSchema?: SearchFacetSchema;
};

/**
 * Authoring-time superset of `SchemaConfig` that lets callers describe
 * per-typeName UI schema customizations as scope overrides. The
 * `defineGraviolaApp` builder turns these into full `uischemata` /
 * `detailUiSchemata` maps via `generateDefaultUISchema` /
 * `generateDefaultDetailUISchema`.
 */
export type OverridableSchemaConfig = SchemaConfig & {
  /** Per-typeName scope overrides for the editing form's UI schema. */
  uischemaScopeOverrides?: FormUiSchemaScopeOverrides;
  /** Per-typeName scope overrides for the detail-view UI schema. */
  detailUiSchemaScopeOverrides?: DetailUiSchemaScopeOverrides;
};

/**
 * Flat JSON side-schema emitted by `graviola-linkml side-schema` / `bundle`.
 * Merged with a domain JSON Schema by `schemaConfigFromSidecars`.
 */
export type GraviolaSideSchema = {
  schemaName?: string;
  label?: string;
  description?: string;
  version?: string;
  cardImage?: string;
  color?: string;
  icon?: string;
  storageKey?: string;
  baseIRI?: string;
  entityBaseIRI?: string;
  primaryFields?: PrimaryFieldDeclaration;
  typeNameLabelMap?: Record<string, string>;
  typeNameUiSchemaOptionsMap?: Record<string, unknown>;
  uischemaScopeOverrides?: FormUiSchemaScopeOverrides;
  detailUiSchemaScopeOverrides?: DetailUiSchemaScopeOverrides;
  tableUiSchemaByType?: Record<string, TableUiSchema>;
  tableUiSchema?: TableUiSchema;
  menuUISchema?: MenuUISchema;
  menuSidebarConfig?: SidebarConfig;
};
