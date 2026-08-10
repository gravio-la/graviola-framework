import React from "react";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
import { encode } from "@jsonforms/core";
import {
  buildDispatch,
  enterArrayDetailFrame,
  DETAIL_ARRAY_INLINE_OPTIONS_KEY,
  readNestingOptions,
  childNestingContext,
  type DetailArrayInlineControlOptions,
  type DetailRendererProps,
  type GenerateDefaultDetailUISchemaOptions,
} from "@graviola/edb-detail-renderer-core";
import { Box } from "@mui/material";
import type { JSONSchema7 } from "json-schema";

import { useDetailRendererContext } from "../context";
import {
  itemVirtualRoot,
  renderDetailInlineObjectBody,
} from "./detailInlineSubDispatch";
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

function computeItemGenerateOptions(
  itemSchemaRoot: JSONSchema7,
  opts: DetailArrayInlineControlOptions | undefined,
):
  | Pick<GenerateDefaultDetailUISchemaOptions, "skipScope" | "scopeOverride">
  | undefined {
  const include =
    opts?.itemIncludeProperties && opts.itemIncludeProperties.length > 0
      ? new Set(opts.itemIncludeProperties)
      : null;

  const skipScope: string[] = [];
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

  const out: Pick<
    GenerateDefaultDetailUISchemaOptions,
    "skipScope" | "scopeOverride"
  > = {};

  if (skipScope.length > 0) out.skipScope = skipScope;
  if (Object.keys(scopeOverride).length > 0) out.scopeOverride = scopeOverride;

  return Object.keys(out).length === 0 ? undefined : out;
}

function itemLabel(
  item: Record<string, unknown>,
  index: number,
  itemSchema: JSONSchema7,
): string {
  const schemaTitle =
    typeof itemSchema.title === "string" ? itemSchema.title : undefined;
  // Prefer schema title; otherwise index. Callers that need a primary-field
  // label should pass it via uiSchema options / ContainedEntityView preview.
  return schemaTitle ?? `Item ${index + 1}`;
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
  const { registry, rootSchema } = useDetailRendererContext();
  const presentOpts = readDetailArrayInlineOpts(uiSchema);
  const optionsDetail = readOptionsDetail(uiSchema);
  const arrayScope = (uiSchema as ControlElement).scope;
  const nesting = readNestingOptions(uiSchema, ctx);
  const childCtx = childNestingContext(uiSchema, ctx);

  if (!Array.isArray(data) || data.length === 0) return null;

  const arr = schema as JSONSchema7;
  const rawItems = arr.items;
  if (!rawItems || typeof rawItems === "boolean") return null;
  const itemSchema = rawItems as JSONSchema7;

  const virtualRoot = itemVirtualRoot(itemSchema, rootSchema);
  const itemGenOpts = computeItemGenerateOptions(itemSchema, presentOpts);

  const compact = Boolean(presentOpts?.compactItems);
  const rowLike = presentOpts?.itemLayout === "row";
  const useCollapsible = Boolean(nesting.collapsible) && !compact;

  const rows = data.map((item: unknown, index: number) => {
    if (item == null || typeof item !== "object") return null;

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
      body = renderDetailInlineObjectBody({
        registry,
        virtualRootSchema: virtualRoot,
        itemData: item as Record<string, unknown>,
        ctx: childCtx,
        extraGenerateDetailOptions: itemGenOpts,
      });
    }

    const itemData = item as Record<string, unknown>;
    const rowLabel = itemLabel(itemData, index, itemSchema);

    if (useCollapsible) {
      return (
        <NestedSection
          key={index}
          label={rowLabel}
          defaultExpanded={nesting.defaultExpanded ?? true}
          flat={nesting.flat}
        >
          {body}
        </NestedSection>
      );
    }

    return (
      <Box
        key={index}
        sx={
          compact
            ? { display: "inline-flex", flexShrink: 0 }
            : {
                pl: 2,
                borderLeft: "2px solid",
                borderColor: "divider",
                mb: 1,
                "&:last-child": { mb: 0 },
              }
        }
      >
        {body}
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

  return <PropertyRow label={label}>{listBody}</PropertyRow>;
}
