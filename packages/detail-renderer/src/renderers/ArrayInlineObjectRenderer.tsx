import React from "react";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
import { encode } from "@jsonforms/core";
import {
  buildDispatch,
  enterArrayDetailFrame,
  DETAIL_ARRAY_INLINE_OPTIONS_KEY,
  readNestingOptions,
  childNestingContext,
  isEntityLikeObjectSchema,
  resolvePropertySchema,
  type DetailArrayInlineControlOptions,
  type DetailRendererProps,
  type GenerateDefaultDetailUISchemaOptions,
} from "@graviola/edb-detail-renderer-core";
import { orderValue, sortIndexedByOrderField } from "@graviola/edb-core-utils";
import { Box, Typography } from "@mui/material";
import type { JSONSchema7 } from "json-schema";

import { useDetailRendererContext } from "../context";
import { readOrderByFromControl } from "../utils/readOrderByFromControl";
import {
  isTopLevelSection,
  shouldStackPropertyRow,
} from "../utils/isTopLevelSection";
import {
  classLevelInlineGenerateOptions,
  mergeInlineItemGenerateOptions,
} from "../utils/inlineItemClassConfig";
import {
  itemVirtualRoot,
  renderDetailInlineObjectBody,
} from "./detailInlineSubDispatch";
import { isCompactLeafOnlyItemSchema } from "./arrayInlineLeafItem";
import { DetailSectionHeading } from "../components/DetailSectionHeading";
import { DetailPresentationProvider } from "../detailPresentationContext";
import { NestedSection } from "./NestedSection";
import { PropertyRow } from "./PropertyRow";

function readOptionsDetail(
  uiSchema: DetailRendererProps["uiSchema"],
): UISchemaElement | undefined {
  const ctrl = uiSchema as ControlElement;
  const detail = ctrl.options?.detail;
  if (detail && typeof detail === "object" && "type" in (detail as object)) {
    return detail as UISchemaElement;
  }
  return undefined;
}

function readDetailArrayInlineOpts(
  uiSchema: DetailRendererProps["uiSchema"],
): DetailArrayInlineControlOptions | undefined {
  const ctrl = uiSchema as ControlElement;
  const bundle = ctrl.options?.[DETAIL_ARRAY_INLINE_OPTIONS_KEY];
  return bundle && typeof bundle === "object" ? bundle : undefined;
}

function orderFieldIsNumeric(
  itemSchemaRoot: JSONSchema7,
  field: string,
): boolean {
  const prop = itemSchemaRoot.properties?.[field] as JSONSchema7 | undefined;
  return prop?.type === "integer" || prop?.type === "number";
}

function computeItemGenerateOptions(
  itemSchemaRoot: JSONSchema7,
  opts: DetailArrayInlineControlOptions | undefined,
  omitPropertyNames: string[] = [],
):
  | Pick<GenerateDefaultDetailUISchemaOptions, "skipScope" | "scopeOverride">
  | undefined {
  const include =
    opts?.itemIncludeProperties && opts.itemIncludeProperties.length > 0
      ? new Set(opts.itemIncludeProperties)
      : null;

  const skipScope: string[] = [];
  for (const propName of omitPropertyNames) {
    skipScope.push(`#/properties/${encode(propName)}`);
  }
  if (include) {
    const props = itemSchemaRoot.properties;
    if (props && typeof props === "object") {
      for (const propName of Object.keys(props)) {
        if (!include.has(propName)) {
          skipScope.push(`#/properties/${encode(propName)}`);
        }
      }
    }
  }

  const scopeOverride: NonNullable<
    GenerateDefaultDetailUISchemaOptions["scopeOverride"]
  > = {};

  if (opts?.hidePropertyLabels) {
    const labelTargets =
      include ?? new Set(Object.keys(itemSchemaRoot.properties ?? {}));

    for (const propName of labelTargets) {
      scopeOverride[`#/properties/${encode(propName)}`] = {
        label: "",
      };
    }
  }

  const out: Partial<
    Pick<GenerateDefaultDetailUISchemaOptions, "skipScope" | "scopeOverride">
  > = {};

  if (skipScope.length > 0) out.skipScope = skipScope;
  if (Object.keys(scopeOverride).length > 0) out.scopeOverride = scopeOverride;

  return Object.keys(out).length === 0 ? undefined : out;
}

function readInlineItemDisplayName(
  item: Record<string, unknown>,
): string | undefined {
  for (const key of ["name", "title", "label"] as const) {
    const value = item[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

/** When the row heading shows `name`, omit redundant identity fields from the body. */
const NAMED_INLINE_ROW_OMIT = ["name", "slug"] as const;

function itemLabel(
  item: Record<string, unknown>,
  index: number,
  itemSchema: JSONSchema7,
): string {
  return (
    readInlineItemDisplayName(item) ??
    (typeof itemSchema.title === "string" ? itemSchema.title : undefined) ??
    `Item ${index + 1}`
  );
}

function OrderBadge({ value }: { value: unknown }) {
  if (value == null || value === "") return null;
  return (
    <Box
      component="span"
      data-testid="order-badge"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 28,
        height: 28,
        borderRadius: "50%",
        bgcolor: "action.selected",
        color: "text.primary",
        fontWeight: 600,
        fontSize: "0.875rem",
        mr: 1,
        flexShrink: 0,
      }}
    >
      {String(value)}
    </Box>
  );
}

/**
 * Renders arrays of anonymous structured objects (items schema type `object` without `@id`)
 * via a per-item sub–detail tree at `rootData = item`.
 */
export function ArrayInlineObjectRenderer({
  label,
  schema,
  data,
  ctx,
  uiSchema,
}: DetailRendererProps) {
  const {
    registry,
    rootSchema,
    config,
    detailUiSchemata,
    orderBy: orderByConfig,
    typeIRIToTypeName: typeIRIToTypeNameFromCtx,
  } = useDetailRendererContext();
  const explicitInlineOpts = readDetailArrayInlineOpts(uiSchema);
  const optionsDetail = readOptionsDetail(uiSchema);
  const arrayScope = (uiSchema as ControlElement).scope;
  const nesting = readNestingOptions(uiSchema, ctx);
  const childCtx = childNestingContext(uiSchema, ctx);
  const orderSpec = readOrderByFromControl(uiSchema);

  if (!Array.isArray(data) || data.length === 0) return null;

  const arr = schema as JSONSchema7;
  const rawItems = arr.items;
  if (!rawItems || typeof rawItems === "boolean") return null;
  const itemSchema = rawItems as JSONSchema7;
  const resolvedItemSchema = resolvePropertySchema(itemSchema, rootSchema);

  const isAnonymousItem = !isEntityLikeObjectSchema(resolvedItemSchema);
  const virtualRootForCompact = itemVirtualRoot(resolvedItemSchema, rootSchema);
  const compactLeafRow =
    isAnonymousItem &&
    isCompactLeafOnlyItemSchema(resolvedItemSchema, virtualRootForCompact);
  const presentOpts: DetailArrayInlineControlOptions | undefined =
    explicitInlineOpts ??
    (compactLeafRow
      ? { compactItems: true, hidePropertyLabels: true }
      : undefined);

  const showOrderBadge = Boolean(
    orderSpec && orderFieldIsNumeric(resolvedItemSchema, orderSpec.field),
  );
  const omitFromBody = showOrderBadge && orderSpec ? [orderSpec.field] : [];

  const virtualRoot = itemVirtualRoot(resolvedItemSchema, rootSchema);
  const leafOnlyInlineRow =
    explicitInlineOpts == null &&
    isAnonymousItem &&
    isCompactLeafOnlyItemSchema(resolvedItemSchema, virtualRoot);

  const itemGenOptsBaseForRow = (
    rowOmit: string[],
  ):
    | Pick<GenerateDefaultDetailUISchemaOptions, "skipScope" | "scopeOverride">
    | undefined =>
    computeItemGenerateOptions(resolvedItemSchema, presentOpts, rowOmit);

  const classLevelOpts = classLevelInlineGenerateOptions(
    itemSchema,
    detailUiSchemata ?? config.uiSchemata,
    orderByConfig,
    {
      rootSchema,
      resolvedItemSchema,
      typeIRIToTypeName: ctx.typeIRIToTypeName ?? typeIRIToTypeNameFromCtx,
    },
  );

  const buildItemGenOpts = (
    rowOmit: string[],
  ):
    | Partial<
        Pick<
          GenerateDefaultDetailUISchemaOptions,
          "skipScope" | "scopeOverride" | "layoutType" | "orderBy"
        >
      >
    | undefined => {
    const itemGenOptsBase = itemGenOptsBaseForRow(rowOmit);
    const presentationOpts =
      leafOnlyInlineRow && itemGenOptsBase
        ? { ...itemGenOptsBase, layoutType: "HorizontalLayout" as const }
        : leafOnlyInlineRow
          ? { layoutType: "HorizontalLayout" as const }
          : itemGenOptsBase;
    const mergedItemGen = mergeInlineItemGenerateOptions(
      classLevelOpts,
      presentationOpts,
    );
    return Object.keys(mergedItemGen).length > 0 ? mergedItemGen : undefined;
  };

  const compact = Boolean(presentOpts?.compactItems);
  const rowLike = presentOpts?.itemLayout === "row";
  const useCollapsible = Boolean(nesting.collapsible) && !compact;

  const indexedItems = sortIndexedByOrderField(data, orderSpec);

  const rows = indexedItems.map(({ item, index }) => {
    if (item == null || typeof item !== "object") return null;

    const itemData = item as Record<string, unknown>;
    const displayName =
      !compact && !leafOnlyInlineRow
        ? readInlineItemDisplayName(itemData)
        : undefined;
    const rowOmitFromBody =
      displayName != null
        ? [
            ...NAMED_INLINE_ROW_OMIT,
            ...(showOrderBadge && orderSpec ? [orderSpec.field] : []),
          ]
        : omitFromBody;

    const rowItemGenOpts = buildItemGenOpts(rowOmitFromBody);

    let body: React.ReactNode;
    if (optionsDetail && arrayScope && ctx.frame) {
      const itemFrame = enterArrayDetailFrame(ctx.frame, arrayScope, index);
      if (itemFrame) {
        const run = buildDispatch(registry, itemFrame.localRootSchema, item, {
          ...childCtx,
          frame: itemFrame,
          depth: childCtx.depth + 1,
        });
        body = run(optionsDetail);
      }
    }
    if (body == null) {
      const inlineBody = renderDetailInlineObjectBody({
        registry,
        virtualRootSchema: virtualRoot,
        itemData: item as Record<string, unknown>,
        ctx: childCtx,
        extraGenerateDetailOptions: rowItemGenOpts,
      });
      body = leafOnlyInlineRow ? (
        <DetailPresentationProvider
          value={{
            compactLeafInline: true,
            hideInlineLabels: true,
            compactNumericColumn: true,
            compactEntityLink: true,
          }}
        >
          {inlineBody}
        </DetailPresentationProvider>
      ) : (
        inlineBody
      );
    }

    const rowLabel = itemLabel(itemData, index, resolvedItemSchema);
    const badgeValue =
      showOrderBadge && orderSpec
        ? orderValue(itemData, orderSpec.field)
        : undefined;

    const itemChrome = displayName ? (
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          {badgeValue != null ? <OrderBadge value={badgeValue} /> : null}
          <Typography component="h3" variant="subtitle2" fontWeight={600}>
            {displayName}
          </Typography>
        </Box>
        {body}
      </Box>
    ) : (
      <>
        {badgeValue != null ? <OrderBadge value={badgeValue} /> : null}
        <Box sx={{ flex: 1, minWidth: 0 }}>{body}</Box>
      </>
    );

    if (useCollapsible) {
      return (
        <NestedSection
          key={index}
          label={rowLabel}
          defaultExpanded={nesting.defaultExpanded ?? true}
          flat={nesting.flat}
        >
          {itemChrome}
        </NestedSection>
      );
    }

    return (
      <Box
        key={index}
        data-original-index={index}
        {...(leafOnlyInlineRow ? { "data-inline-leaf-row": "" } : {})}
        sx={
          compact
            ? {
                display: "flex",
                alignItems: "flex-start",
                flexShrink: 0,
                width: rowLike ? undefined : "100%",
              }
            : {
                display: "flex",
                alignItems: "flex-start",
                pl: 2,
                borderLeft: "2px solid",
                borderColor: "divider",
                mb: 1,
                "&:last-child": { mb: 0 },
              }
        }
      >
        {itemChrome}
      </Box>
    );
  });

  if (!rows.some(Boolean)) return null;

  const listBody = (
    <Box
      sx={{
        display: "flex",
        flexWrap: compact && rowLike ? "wrap" : "nowrap",
        flexDirection: rowLike ? "row" : "column",
        gap: compact ? 0.75 : useCollapsible ? 0.25 : 1,
        alignItems: rowLike ? "center" : "stretch",
        alignContent: compact && rowLike ? "flex-start" : undefined,
      }}
    >
      {rows}
    </Box>
  );

  if (useCollapsible) {
    return (
      <NestedSection
        label={label}
        defaultExpanded={nesting.defaultExpanded ?? true}
        flat={nesting.flat}
      >
        {listBody}
      </NestedSection>
    );
  }

  const topSection = isTopLevelSection(ctx, label);

  if (topSection) {
    return (
      <Box>
        <DetailSectionHeading>{label}</DetailSectionHeading>
        {listBody}
      </Box>
    );
  }

  return (
    <PropertyRow label={label} stacked={shouldStackPropertyRow(ctx)}>
      {listBody}
    </PropertyRow>
  );
}
