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
import type { OverridableSchemaConfig, SchemaConfig } from "./schemaTypes";

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

export function makeSchemaConfig(
  config: OverridableSchemaConfig,
): SchemaConfig {
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
