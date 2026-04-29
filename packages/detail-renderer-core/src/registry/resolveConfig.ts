import type { UISchemaElement } from "@jsonforms/core";
import type { DetailViewConfig } from "../types";

export function resolveConfigForType(
  config: DetailViewConfig,
  typeIRI?: string,
  typeName?: string,
): DetailViewConfig {
  const byName = typeName ? config.typeNameOverrides?.[typeName] : undefined;
  const byIRI = typeIRI ? config.typeIRIOverrides?.[typeIRI] : undefined;
  return mergeConfigs(config, byName, byIRI);
}

function mergeConfigs(
  ...layers: (Partial<DetailViewConfig> | undefined)[]
): DetailViewConfig {
  return layers.filter(Boolean).reduce<DetailViewConfig>((acc, override) => {
    if (!override) return acc;
    return {
      ...acc,
      ...override,
      uiSchemata: { ...(acc.uiSchemata ?? {}), ...(override.uiSchemata ?? {}) },
      uiSchemataByTypeIRI: {
        ...(acc.uiSchemataByTypeIRI ?? {}),
        ...(override.uiSchemataByTypeIRI ?? {}),
      },
      ...(override.primaryFields !== undefined
        ? {
            primaryFields: {
              ...(acc.primaryFields as Record<string, unknown> | undefined),
              ...(override.primaryFields as Record<string, unknown>),
            },
          }
        : {}),
      extraRenderers: [
        ...(override.extraRenderers ?? []),
        ...(acc.extraRenderers ?? []),
      ],
      linkedDataPropertyNames: [
        ...(acc.linkedDataPropertyNames ?? []),
        ...(override.linkedDataPropertyNames ?? []),
      ],
      hiddenPropertyNames: [
        ...(acc.hiddenPropertyNames ?? []),
        ...(override.hiddenPropertyNames ?? []),
      ],
      alwaysShowPropertyNames: [
        ...(acc.alwaysShowPropertyNames ?? []),
        ...(override.alwaysShowPropertyNames ?? []),
      ],
    };
  }, {} as DetailViewConfig);
}

/** Prefer explicit uiSchema prop, then per-type maps from merged config. */
export function resolveEffectiveUISchemaRoot(
  mergedConfig: DetailViewConfig,
  explicit: UISchemaElement | undefined,
  typeIRI: string | undefined,
  typeName: string | undefined,
): UISchemaElement | undefined {
  if (explicit) return explicit;
  if (typeName && mergedConfig.uiSchemata?.[typeName])
    return mergedConfig.uiSchemata[typeName];
  if (typeIRI && mergedConfig.uiSchemataByTypeIRI?.[typeIRI])
    return mergedConfig.uiSchemataByTypeIRI[typeIRI];
  return undefined;
}
