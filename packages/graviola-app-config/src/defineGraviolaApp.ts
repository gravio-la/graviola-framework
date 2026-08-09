import type { JsonSchema } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import {
  generateDefaultDetailUISchema,
  type GenerateDefaultDetailUISchemaOptions,
} from "@graviola/edb-detail-renderer";
import {
  generateDefaultUISchema,
  type GenerateUISchemaOptions,
} from "@graviola/edb-ui-utils";
import {
  compileCalcProfile,
  type CalcProfileSidecar,
  type CalcProfileSlot,
} from "@graviola/formula-dependency";
import {
  loadSearchFacetSchema,
  type SearchFacetSchema,
} from "@graviola/search-facet-schema";
import type { SidecarDocument } from "@graviola/sidecar-core";
import type {
  GraviolaSideSchema,
  OverridableSchemaConfig,
  SchemaConfig,
} from "./types";

/**
 * Build a JSON Forms detail UISchema for one definition in the schema. Wraps
 * `generateDefaultDetailUISchema` with a `bringDefinitionToTop` step so callers
 * pass the root schema + definition name instead of a pre-flattened schema.
 */
export function detailUiSchemaForDefinition(
  rootSchema: JSONSchema7,
  definitionName: string,
  options?: GenerateDefaultDetailUISchemaOptions,
) {
  return generateDefaultDetailUISchema(
    bringDefinitionToTop(
      rootSchema as never,
      definitionName,
    ) as unknown as JsonSchema,
    { layoutType: "TopLevelLayout", ...options },
  );
}

/**
 * Build a JSON Forms editing UISchema for one definition in the schema.
 */
export function uiSchemaForDefinition(
  rootSchema: JSONSchema7,
  definitionName: string,
  options?: GenerateUISchemaOptions,
) {
  return generateDefaultUISchema(
    bringDefinitionToTop(
      rootSchema as never,
      definitionName,
    ) as unknown as JsonSchema,
    options ?? {},
  );
}

export type DefineGraviolaAppInput = OverridableSchemaConfig;

/**
 * Single-call builder for a `SchemaConfig`. Accepts the more ergonomic
 * `OverridableSchemaConfig` shape (with `uischemaScopeOverrides` /
 * `detailUiSchemaScopeOverrides`, including `mode: "override" | "exclusive"`).
 *
 * Output is a fully-resolved `SchemaConfig` ready to feed to
 * `<GraviolaAppProvider schemaConfig={...} />`.
 */
export function defineGraviolaApp(input: DefineGraviolaAppInput): SchemaConfig {
  const config: OverridableSchemaConfig = input;

  const {
    uischemaScopeOverrides,
    detailUiSchemaScopeOverrides,
    detailUiSchemata: explicitDetailUiSchemata,
    uischemata: explicitUischemata,
    ...rest
  } = config;

  let detailUiSchemata: SchemaConfig["detailUiSchemata"];

  if (
    detailUiSchemaScopeOverrides &&
    Object.keys(detailUiSchemaScopeOverrides).length > 0
  ) {
    const generated: NonNullable<SchemaConfig["detailUiSchemata"]> = {};
    for (const [typeName, opts] of Object.entries(
      detailUiSchemaScopeOverrides,
    )) {
      generated[typeName] = detailUiSchemaForDefinition(
        config.schema,
        typeName,
        opts,
      );
    }
    detailUiSchemata = { ...generated, ...explicitDetailUiSchemata };
  } else {
    detailUiSchemata = explicitDetailUiSchemata;
  }

  let uischemata: SchemaConfig["uischemata"];

  if (
    uischemaScopeOverrides &&
    Object.keys(uischemaScopeOverrides).length > 0
  ) {
    const generated: NonNullable<SchemaConfig["uischemata"]> = {};
    for (const [typeName, opts] of Object.entries(uischemaScopeOverrides)) {
      generated[typeName] = uiSchemaForDefinition(
        config.schema,
        typeName,
        opts,
      );
    }
    uischemata = { ...generated, ...explicitUischemata };
  } else {
    uischemata = explicitUischemata;
  }

  return {
    ...rest,
    uischemata,
    detailUiSchemata,
  };
}

/** Compatibility alias for callers that already use the testapp's name. */
export const makeSchemaConfig = defineGraviolaApp;

export type SchemaConfigFromSidecarsInput = {
  /** Domain JSON Schema (`definitions` map). */
  schema: JSONSchema7;
  /** Flat side-schema from `graviola-linkml side-schema`. */
  sideSchema: GraviolaSideSchema;
  /** Optional calc-profile sidecar from `graviola-linkml calc-profile`. */
  calcProfile?: SidecarDocument<CalcProfileSlot> | CalcProfileSidecar;
  /** Optional search-facet sidecar from `graviola-linkml search-facet`. */
  searchFacet?: SearchFacetSchema | unknown;
  /** Optional Turtle / JSON-LD seed (not produced by LinkML). */
  initialData?: string;
};

/**
 * Assemble a resolved `SchemaConfig` solely from JSON sidecars:
 * domain schema + UI/app side-schema (+ optional calc-profile / search-facet).
 *
 * Calls `bringDefinitionToTop` / `generateDefaultUISchema` /
 * `generateDefaultDetailUISchema` via `defineGraviolaApp`,
 * `compileCalcProfile` when a calc sidecar is present, and
 * `loadSearchFacetSchema` when a search-facet sidecar is present.
 */
export function schemaConfigFromSidecars(
  input: SchemaConfigFromSidecarsInput,
): SchemaConfig {
  const {
    schema,
    sideSchema,
    calcProfile: calcSidecar,
    searchFacet,
    initialData,
  } = input;

  const overridable: OverridableSchemaConfig = {
    schemaName: sideSchema.schemaName ?? "schema",
    label: sideSchema.label ?? sideSchema.schemaName ?? "Schema",
    description: sideSchema.description ?? "",
    version: sideSchema.version ?? "0.0.0",
    cardImage: sideSchema.cardImage,
    color: sideSchema.color,
    icon: sideSchema.icon,
    storageKey: sideSchema.storageKey ?? sideSchema.schemaName ?? "schema",
    initialData,
    baseIRI: sideSchema.baseIRI ?? "",
    entityBaseIRI: sideSchema.entityBaseIRI ?? sideSchema.baseIRI ?? "",
    schema,
    primaryFields: sideSchema.primaryFields ?? {},
    typeNameLabelMap: sideSchema.typeNameLabelMap ?? {},
    typeNameUiSchemaOptionsMap: sideSchema.typeNameUiSchemaOptionsMap ?? {},
    uischemaScopeOverrides: sideSchema.uischemaScopeOverrides,
    detailUiSchemaScopeOverrides: sideSchema.detailUiSchemaScopeOverrides,
    tableUiSchemaByType: sideSchema.tableUiSchemaByType,
    tableUiSchema: sideSchema.tableUiSchema,
    menuUISchema: sideSchema.menuUISchema,
    menuSidebarConfig: sideSchema.menuSidebarConfig,
  };

  let resolved = defineGraviolaApp(overridable);

  if (calcSidecar) {
    resolved = {
      ...resolved,
      calcProfile: compileCalcProfile(calcSidecar, schema),
    };
  }

  if (searchFacet != null) {
    resolved = {
      ...resolved,
      searchFacetSchema: loadSearchFacetSchema(searchFacet),
    };
  }

  return resolved;
}
