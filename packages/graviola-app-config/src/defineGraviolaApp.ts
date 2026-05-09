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
import type { OverridableSchemaConfig, SchemaConfig } from "./types";

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
 * `detailUiSchemaScopeOverrides`).
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
