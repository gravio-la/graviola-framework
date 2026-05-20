import React from "react";
import type { ControlElement } from "@jsonforms/core";
import { encode } from "@jsonforms/core";
import {
  DETAIL_ARRAY_INLINE_OPTIONS_KEY,
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
import { PropertyRow } from "./PropertyRow";

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

  if (!Array.isArray(data) || data.length === 0) return null;

  const arr = schema as JSONSchema7;
  const rawItems = arr.items;
  if (!rawItems || typeof rawItems === "boolean") return null;
  const itemSchema = rawItems as JSONSchema7;

  const virtualRoot = itemVirtualRoot(itemSchema, rootSchema);
  const itemGenOpts = computeItemGenerateOptions(itemSchema, presentOpts);

  const compact = Boolean(presentOpts?.compactItems);
  const rowLike = presentOpts?.itemLayout === "row";

  const rows = data.map((item: unknown, index: number) => {
    if (item == null || typeof item !== "object") return null;
    const body = renderDetailInlineObjectBody({
      registry,
      virtualRootSchema: virtualRoot,
      itemData: item as Record<string, unknown>,
      ctx,
      extraGenerateDetailOptions: itemGenOpts,
    });
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

  return (
    <PropertyRow label={label}>
      <Box
        sx={{
          display: "flex",
          flexWrap: compact && rowLike ? "wrap" : "nowrap",
          flexDirection: rowLike ? "row" : "column",
          gap: compact ? 0.75 : 1,
          alignItems: rowLike ? "center" : "stretch",
          alignContent: compact && rowLike ? "flex-start" : undefined,
        }}
      >
        {rows}
      </Box>
    </PropertyRow>
  );
}
