import React, { useMemo } from "react";
import type { JSONSchema7 } from "json-schema";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { extractTypeIRI } from "@graviola/json-schema-utils";
import {
  buildDispatch,
  type DetailViewConfig,
  generateDefaultDetailUISchema,
  resolveConfigForType,
  resolveEffectiveUISchemaRoot,
} from "@graviola/edb-detail-renderer-core";
import {
  applyToEachField,
  extractFieldIfString,
} from "@graviola/edb-data-mapping";
import { useAdbContext } from "@graviola/edb-state-hooks";
import { defaultDetailRenderers } from "./renderers";
import { DetailRendererContext } from "./context";
import type { GenerateDefaultDetailUISchemaOptions } from "@graviola/edb-detail-renderer-core";

const DEFAULT_LINKED_DATA_PROPERTY_NAMES = ["@id", "@type"];

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

function fieldNameFromPrimaryDeclarationPart(part: unknown): string | null {
  if (typeof part === "string" && part.length > 0) {
    return part.split(".")[0] ?? null;
  }
  if (
    part &&
    typeof part === "object" &&
    typeof (part as { path?: unknown }).path === "string"
  ) {
    const path = (part as { path: string }).path;
    return path.split(".")[0] ?? null;
  }
  return null;
}

function getHeaderPrimaryFieldNames(primaryDecl: unknown): string[] {
  if (!primaryDecl || typeof primaryDecl !== "object") return [];
  return unique(
    Object.values(primaryDecl as Record<string, unknown>)
      .map(fieldNameFromPrimaryDeclarationPart)
      .filter((x): x is string => Boolean(x)),
  );
}

function mergeDetailViewConfigs(
  base: Partial<DetailViewConfig> | undefined,
  override: Partial<DetailViewConfig> | undefined,
): DetailViewConfig {
  return {
    ...(base ?? {}),
    ...(override ?? {}),
    uiSchemata: {
      ...(base?.uiSchemata ?? {}),
      ...(override?.uiSchemata ?? {}),
    },
    uiSchemataByTypeIRI: {
      ...(base?.uiSchemataByTypeIRI ?? {}),
      ...(override?.uiSchemataByTypeIRI ?? {}),
    },
    ...(base?.primaryFields || override?.primaryFields
      ? {
          primaryFields: {
            ...(base?.primaryFields as Record<string, unknown> | undefined),
            ...(override?.primaryFields as Record<string, unknown> | undefined),
          },
        }
      : {}),
    extraRenderers: [
      ...(override?.extraRenderers ?? []),
      ...(base?.extraRenderers ?? []),
    ],
    linkedDataPropertyNames: [
      ...(base?.linkedDataPropertyNames ?? []),
      ...(override?.linkedDataPropertyNames ?? []),
    ],
    hiddenPropertyNames: [
      ...(base?.hiddenPropertyNames ?? []),
      ...(override?.hiddenPropertyNames ?? []),
    ],
    alwaysShowPropertyNames: [
      ...(base?.alwaysShowPropertyNames ?? []),
      ...(override?.alwaysShowPropertyNames ?? []),
    ],
  };
}

export interface DetailRendererRootProps {
  schema: JSONSchema7;
  data: unknown;
  /**
   * JSON Forms UISchema root. If omitted, see `generateUISchema` and `config.uiSchemata*`.
   */
  uiSchema?: UISchemaElement;
  /** When true (default), generate a default tree with `TopLevelLayout` if no uiSchema resolved. */
  generateUISchema?: boolean;
  uiSchemaOptions?: GenerateDefaultDetailUISchemaOptions;
  config?: DetailViewConfig;
  /** Falls back to `extractTypeIRI(schema)` */
  typeIRI?: string;
  typeName?: string;
  entityIRI?: string;
  humanLabel?: string;
  isLoading?: boolean;
}

export const DetailRenderer = React.memo(function DetailRenderer({
  schema,
  data,
  uiSchema: uiSchemaProp,
  generateUISchema = true,
  uiSchemaOptions,
  config: configProp = {},
  typeIRI: typeIRIProp,
  typeName: typeNameProp,
  entityIRI,
  humanLabel,
  isLoading,
}: DetailRendererRootProps) {
  const adb = useAdbContext();
  const detailViewConfigFromAdb = (
    adb as { detailViewConfig?: DetailViewConfig }
  ).detailViewConfig;
  const baseConfig = useMemo(
    () => mergeDetailViewConfigs(detailViewConfigFromAdb, configProp),
    [detailViewConfigFromAdb, configProp],
  );
  const typeIRIToTypeName =
    baseConfig.typeIRIToTypeName ?? adb.typeIRIToTypeName;
  const primaryFieldsFromAdb = (
    adb.queryBuildOptions as { primaryFields?: Record<string, unknown> }
  )?.primaryFields;

  const typeIRI = useMemo(
    () => typeIRIProp ?? extractTypeIRI(schema) ?? undefined,
    [typeIRIProp, schema],
  );
  const typeName = useMemo(
    () =>
      typeNameProp ??
      (typeIRI && typeIRIToTypeName ? typeIRIToTypeName(typeIRI) : undefined),
    [typeNameProp, typeIRI, typeIRIToTypeName],
  );

  const resolvedConfig = useMemo(
    () => resolveConfigForType(baseConfig, typeIRI, typeName),
    [baseConfig, typeIRI, typeName],
  );
  const primaryFields = resolvedConfig.primaryFields ?? primaryFieldsFromAdb;

  const registry = useMemo(
    () =>
      resolvedConfig.overrideRenderers ?? [
        ...(resolvedConfig.extraRenderers ?? []),
        ...defaultDetailRenderers,
      ],
    [resolvedConfig],
  );

  const headerPreview = useMemo(() => {
    if (!data || !typeName || !primaryFields) return null;
    const decl = primaryFields[typeName] as Parameters<
      typeof applyToEachField
    >[1];
    if (!decl) return null;
    return applyToEachField(data, decl, extractFieldIfString) as {
      label: string | null;
      description: string | null;
      image: string | null;
    };
  }, [data, typeName, primaryFields]);
  const headerPrimaryFieldNames = useMemo(() => {
    if (!typeName || !primaryFields) return [];
    return getHeaderPrimaryFieldNames(primaryFields[typeName]);
  }, [primaryFields, typeName]);
  const linkedDataPropertyNames = useMemo(
    () =>
      unique([
        ...DEFAULT_LINKED_DATA_PROPERTY_NAMES,
        ...(resolvedConfig.linkedDataPropertyNames ?? []),
      ]),
    [resolvedConfig.linkedDataPropertyNames],
  );

  const effectiveUISchema = useMemo((): UISchemaElement | undefined => {
    const fromConfig = resolveEffectiveUISchemaRoot(
      resolvedConfig,
      uiSchemaProp,
      typeIRI,
      typeName,
    );
    if (fromConfig) return fromConfig;
    if (!generateUISchema || !schema) return undefined;
    return generateDefaultDetailUISchema(schema as JsonSchema, {
      layoutType: "TopLevelLayout",
      ...uiSchemaOptions,
    });
  }, [
    resolvedConfig,
    uiSchemaProp,
    typeIRI,
    typeName,
    generateUISchema,
    schema,
    uiSchemaOptions,
  ]);

  const initialCtx = useMemo(
    () => ({
      rootSchema: schema,
      depth: 0,
      maxDepth: resolvedConfig.maxDepth ?? 3,
      typeIRI,
      typeName,
      typeIRIToTypeName,
      headerPreview,
      entityIRI,
      humanLabel,
      isLoading,
      hideLinkedDataProperties: resolvedConfig.hideLinkedDataProperties ?? true,
      linkedDataPropertyNames,
      hideHeaderPrimaryFields: resolvedConfig.hideHeaderPrimaryFields ?? true,
      hiddenPropertyNames: unique(resolvedConfig.hiddenPropertyNames ?? []),
      alwaysShowPropertyNames: unique(
        resolvedConfig.alwaysShowPropertyNames ?? [],
      ),
      headerPrimaryFieldNames,
    }),
    [
      schema,
      resolvedConfig.maxDepth,
      typeIRI,
      typeName,
      typeIRIToTypeName,
      headerPreview,
      entityIRI,
      humanLabel,
      isLoading,
      resolvedConfig.hideLinkedDataProperties,
      linkedDataPropertyNames,
      resolvedConfig.hideHeaderPrimaryFields,
      resolvedConfig.hiddenPropertyNames,
      resolvedConfig.alwaysShowPropertyNames,
      headerPrimaryFieldNames,
    ],
  );

  const body = useMemo(() => {
    if (!effectiveUISchema || schema == null) return null;
    const run = buildDispatch(registry, schema, data, initialCtx);
    return run(effectiveUISchema);
  }, [effectiveUISchema, registry, schema, data, initialCtx]);

  const contextValue = useMemo(
    () => ({
      registry,
      rootSchema: schema,
      uiSchema: effectiveUISchema,
      config: resolvedConfig,
    }),
    [registry, schema, effectiveUISchema, resolvedConfig],
  );

  return (
    <DetailRendererContext.Provider value={contextValue}>
      {body}
    </DetailRendererContext.Provider>
  );
});
