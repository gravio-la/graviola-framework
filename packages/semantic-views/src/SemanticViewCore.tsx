import React, { useMemo } from "react";
import type { JSONSchema7 } from "json-schema";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { CardPresentation } from "@graviola/edb-core-types";
import {
  buildDispatch,
  generateDefaultViewUISchema,
  resolveConfigForType,
  resolveEffectiveUISchemaRoot,
  type DetailRendererRegistryEntry,
  type DetailViewConfig,
  type ViewSize,
} from "@graviola/edb-detail-renderer-core";
import { extractTypeIRI, rootFrame } from "@graviola/json-schema-utils";
import {
  DetailRendererContext,
  MotionAdapterProvider,
  NoopMotionAdapter,
  defaultCardRenderers,
  defaultChipRenderers,
  defaultDetailRenderers,
  defaultListItemRenderers,
  defaultValueRenderers,
} from "@graviola/edb-detail-renderer";
import {
  useAdbContext,
  useEntityPreview,
  useExtendedSchema,
} from "@graviola/edb-state-hooks";
import type {
  CardViewConfigOptions,
  DetailViewConfigOptions,
  ViewConfig,
  ViewConfigSet,
} from "@graviola/semantic-jsonform-types";

import type { SemanticViewNoOpsProps } from "./types";
import { SemanticComponentMap } from "./semanticComponentMap";

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

function resolveCardPresentation(
  adbCardPresentation: Record<string, CardPresentation> | undefined,
  viewConfigSlice: ViewConfig | undefined,
  typeName: string | undefined,
): CardPresentation | undefined {
  const fromRegistry =
    typeName && adbCardPresentation ? adbCardPresentation[typeName] : undefined;
  const fromViewConfig = (
    viewConfigSlice?.options as CardViewConfigOptions | undefined
  )?.cardPresentation;
  if (!fromRegistry && !fromViewConfig) return undefined;
  return { ...fromRegistry, ...fromViewConfig };
}

function resolveViewConfig(
  viewConfig: ViewConfigSet | undefined,
  size: ViewSize,
  legacyDetailOptions?: DetailViewConfigOptions,
): ViewConfig | undefined {
  const base = viewConfig?.[size];
  if (size !== "detail" || !legacyDetailOptions) return base;
  return {
    ...(base ?? {}),
    options: {
      ...(base?.options ?? {}),
      ...legacyDetailOptions,
    },
  };
}

const REGISTRY_BY_SIZE: Record<ViewSize, DetailRendererRegistryEntry[]> = {
  chip: defaultChipRenderers,
  listItem: defaultListItemRenderers,
  card: defaultCardRenderers,
  detail: defaultDetailRenderers,
};

export function SemanticViewCore({
  viewSize,
  data,
  schema: schemaProp,
  typeIRI: typeIRIProp,
  typeName: typeNameProp,
  uiSchema: uiSchemaProp,
  config: configProp,
  entityIRI,
  humanLabel,
  isLoading,
  motionId,
}: SemanticViewNoOpsProps & {
  viewSize: ViewSize;
  entityIRI?: string;
  humanLabel?: string;
}) {
  const adb = useAdbContext();
  const typeIRI = useMemo(
    () =>
      typeIRIProp ??
      (data && typeof data === "object"
        ? extractTypeIRI(data as Record<string, unknown>)
        : undefined),
    [typeIRIProp, data],
  );
  const typeName = useMemo(
    () =>
      typeNameProp ?? (typeIRI ? adb.typeIRIToTypeName(typeIRI) : undefined),
    [typeNameProp, typeIRI, adb.typeIRIToTypeName],
  );
  const schemaFromHook = useExtendedSchema({ typeName });
  const schema = schemaProp ?? (typeName ? schemaFromHook : undefined);
  const preview = useEntityPreview(data, { typeName, typeIRI });

  const viewConfigSlice = resolveViewConfig(
    adb.viewConfig,
    viewSize,
    adb.detailViewConfig,
  );

  const baseConfig = useMemo((): DetailViewConfig => {
    const merged: DetailViewConfig = {
      ...(viewConfigSlice as DetailViewConfig),
      ...(configProp ?? {}),
      typeIRIToTypeName: adb.typeIRIToTypeName,
    };
    return merged;
  }, [viewConfigSlice, configProp, adb.typeIRIToTypeName]);

  const resolvedConfig = useMemo(
    () => resolveConfigForType(baseConfig, typeIRI, typeName),
    [baseConfig, typeIRI, typeName],
  );

  const registry = useMemo(
    () =>
      resolvedConfig.overrideRenderers ?? [
        ...(resolvedConfig.extraRenderers ?? []),
        ...REGISTRY_BY_SIZE[viewSize],
        ...(resolvedConfig.fallbackRenderers ?? []),
      ],
    [resolvedConfig, viewSize],
  );

  const valueRenderers = useMemo(
    () => [
      ...(resolvedConfig.overrideValueRenderers ?? []),
      ...(resolvedConfig.valueRenderers ?? []),
      ...defaultValueRenderers,
    ],
    [resolvedConfig.overrideValueRenderers, resolvedConfig.valueRenderers],
  );

  const primaryFields =
    resolvedConfig.primaryFields ?? adb.queryBuildOptions.primaryFields;

  const cardPresentation = useMemo(
    () =>
      viewSize === "card"
        ? resolveCardPresentation(
            adb.cardPresentation as
              | Record<string, CardPresentation>
              | undefined,
            viewConfigSlice,
            typeName,
          )
        : undefined,
    [viewSize, adb.cardPresentation, viewConfigSlice, typeName],
  );

  const headerPrimaryFieldNames = useMemo(() => {
    if (!typeName || !primaryFields) return [];
    return getHeaderPrimaryFieldNames(primaryFields[typeName]);
  }, [primaryFields, typeName]);

  const cardViewOptions = viewConfigSlice?.options as
    | CardViewConfigOptions
    | undefined;

  const effectiveUISchema = useMemo((): UISchemaElement | undefined => {
    const fromConfig = resolveEffectiveUISchemaRoot(
      resolvedConfig,
      uiSchemaProp,
      typeIRI,
      typeName,
    );
    if (fromConfig) return fromConfig;
    if (!schema) return undefined;
    const pf = typeName ? primaryFields[typeName] : undefined;
    return generateDefaultViewUISchema(viewSize, schema as JsonSchema, pf, {
      layoutType:
        viewSize === "detail" ? "TopLevelLayout" : `${viewSize}Layout`,
      rootSchema: schema as JsonSchema,
      ...resolvedConfig.defaultGenerationOptions,
      cardPresentation:
        viewSize === "card"
          ? (cardPresentation ?? resolvedConfig.cardPresentation)
          : undefined,
    });
  }, [
    resolvedConfig,
    uiSchemaProp,
    typeIRI,
    typeName,
    schema,
    viewSize,
    primaryFields,
    cardPresentation,
  ]);

  const initialCtx = useMemo(
    () => ({
      rootSchema: schema as JSONSchema7,
      depth: 0,
      maxDepth: resolvedConfig.maxDepth ?? 3,
      viewSize,
      frame: schema ? rootFrame(schema) : undefined,
      typeIRI,
      typeName,
      typeIRIToTypeName: adb.typeIRIToTypeName,
      preview,
      headerPreview: {
        label: preview.label ?? null,
        description: preview.description ?? null,
        image: preview.image ?? null,
      },
      entityIRI: entityIRI ?? motionId,
      humanLabel,
      isLoading,
      valueRenderers,
      // Hide @id/@type in the property grid (TopLevelLayout already shows entityIRI).
      // Stub schemas set `@id.title` to entityBaseIRI — leaving @id visible looks like
      // overlapping IRIs in the detail header.
      hideLinkedDataProperties:
        (resolvedConfig.hideLinkedDataProperties as boolean | undefined) ??
        true,
      linkedDataPropertyNames: unique([
        ...DEFAULT_LINKED_DATA_PROPERTY_NAMES,
        ...((resolvedConfig.linkedDataPropertyNames as string[] | undefined) ??
          []),
      ]),
      hideHeaderPrimaryFields:
        viewSize === "card" ||
        viewSize === "detail" ||
        (resolvedConfig.hideHeaderPrimaryFields as boolean | undefined) ===
          true,
      headerPrimaryFieldNames,
      topLevelLayoutVariant: resolvedConfig.topLevelLayoutVariant,
    }),
    [
      schema,
      resolvedConfig.maxDepth,
      resolvedConfig.hideLinkedDataProperties,
      resolvedConfig.linkedDataPropertyNames,
      resolvedConfig.hideHeaderPrimaryFields,
      resolvedConfig.topLevelLayoutVariant,
      viewSize,
      typeIRI,
      typeName,
      adb.typeIRIToTypeName,
      preview,
      entityIRI,
      motionId,
      humanLabel,
      isLoading,
      valueRenderers,
      headerPrimaryFieldNames,
    ],
  );

  const body = useMemo(() => {
    if (!schema || !effectiveUISchema) return null;
    const run = buildDispatch(registry, schema, data, initialCtx);
    return run(effectiveUISchema);
  }, [schema, data, registry, initialCtx, effectiveUISchema]);

  const contextValue = useMemo(
    () => ({
      registry,
      rootSchema: schema,
      rootData: data,
      config: {
        ...resolvedConfig,
        cardPresentation: cardPresentation ?? resolvedConfig.cardPresentation,
        onCardAction:
          resolvedConfig.onCardAction ?? cardViewOptions?.onCardAction,
      },
      containedEntityComponents: SemanticComponentMap,
    }),
    [
      registry,
      schema,
      data,
      resolvedConfig,
      cardPresentation,
      cardViewOptions?.onCardAction,
    ],
  );

  if (!schema || !body) return null;

  return (
    <MotionAdapterProvider adapter={NoopMotionAdapter}>
      <DetailRendererContext.Provider value={contextValue}>
        {body}
      </DetailRendererContext.Provider>
    </MotionAdapterProvider>
  );
}
