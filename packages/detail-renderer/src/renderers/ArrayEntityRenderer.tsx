import React from "react";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import type { JSONSchema7 } from "json-schema";
import { Box, Stack, Typography } from "@mui/material";

import { useDetailRendererContext } from "../context";
import {
  itemVirtualRoot,
  renderDetailInlineObjectBody,
} from "./detailInlineSubDispatch";
import type { ControlElement } from "@jsonforms/core";

import {
  ContainedEntityView,
  containedAsFromUiSchema,
} from "./ContainedEntityView";
import { PropertyRow } from "./PropertyRow";

function hasStableEntityId(obj: Record<string, unknown>): boolean {
  const id = obj["@id"];
  return typeof id === "string" && id.length > 0;
}

function isEntityLikeData(obj: Record<string, unknown>): boolean {
  return typeof obj["@type"] === "string" || hasStableEntityId(obj);
}

/**
 * Schema-typed entity arrays render as chips when items carry `@type` and/or `@id`.
 * Named items (`@id`) are clickable via intent dispatch in {@link ContainedEntityView}.
 */
export function ArrayEntityRenderer({
  label,
  data,
  schema,
  uiSchema,
  ctx,
}: DetailRendererProps) {
  const { registry, rootSchema } = useDetailRendererContext();
  const containedAs = containedAsFromUiSchema(
    uiSchema as ControlElement,
    "chip",
  );

  if (!Array.isArray(data) || data.length === 0) return null;

  const rawItems = (schema as JSONSchema7).items;
  const itemSchema =
    rawItems && typeof rawItems === "object" && rawItems !== null
      ? (rawItems as JSONSchema7)
      : undefined;
  const virtualRoot =
    itemSchema?.type === "object"
      ? itemVirtualRoot(itemSchema, rootSchema)
      : undefined;

  const allEntityLikeChips = data.every(
    (item) =>
      item != null &&
      typeof item === "object" &&
      isEntityLikeData(item as Record<string, unknown>),
  );

  const stackDirection = containedAs === "card" ? "row" : "row";
  const stackGap = containedAs === "card" ? 1.5 : 0.5;

  if (allEntityLikeChips) {
    return (
      <PropertyRow label={label}>
        <Stack direction={stackDirection} flexWrap="wrap" gap={stackGap}>
          {(data as unknown[]).map((item: unknown, index: number) => {
            if (item == null || typeof item !== "object") return null;
            const d = item as Record<string, unknown>;
            const key =
              (typeof d["@id"] === "string" && d["@id"]) ||
              (typeof d["@type"] === "string" && `${d["@type"]}-${index}`) ||
              `item-${index}`;
            return (
              <ContainedEntityView
                key={key}
                data={d}
                schema={itemSchema}
                containedAs={containedAs}
                ctx={ctx}
              />
            );
          })}
        </Stack>
      </PropertyRow>
    );
  }

  const rows = data.map((item: unknown, index: number) => {
    if (item == null || typeof item !== "object") return null;
    const d = item as Record<string, unknown>;
    const typeIRI = d["@type"];

    if (isEntityLikeData(d)) {
      const key =
        (typeof d["@id"] === "string" && d["@id"]) ||
        (typeof typeIRI === "string" && `${typeIRI}-${index}`) ||
        `item-${index}`;
      return (
        <ContainedEntityView
          key={key}
          data={d}
          schema={itemSchema}
          containedAs={containedAs}
          ctx={ctx}
        />
      );
    }

    if (virtualRoot && itemSchema?.type === "object") {
      const body = renderDetailInlineObjectBody({
        registry,
        virtualRootSchema: virtualRoot,
        itemData: d,
        ctx,
      });
      return (
        <Box
          key={`inline-${index}`}
          sx={{
            pl: 2,
            borderLeft: "2px solid",
            borderColor: "divider",
          }}
        >
          {body}
        </Box>
      );
    }

    return (
      <Typography key={`fallback-${index}`} variant="body2">
        {typeof typeIRI === "string" ? typeIRI : JSON.stringify(Object.keys(d))}
      </Typography>
    );
  });

  if (!rows.some(Boolean)) return null;

  return (
    <PropertyRow label={label}>
      <Stack direction="column" gap={1} alignItems="flex-start">
        {rows}
      </Stack>
    </PropertyRow>
  );
}
