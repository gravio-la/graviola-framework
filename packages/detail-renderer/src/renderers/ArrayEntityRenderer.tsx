import React from "react";
import { EntityChip } from "@graviola/edb-advanced-components";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import type { JSONSchema7 } from "json-schema";
import { Box, Stack, Typography } from "@mui/material";

import { useDetailRendererContext } from "../context";
import {
  itemVirtualRoot,
  renderDetailInlineObjectBody,
} from "./detailInlineSubDispatch";
import { PropertyRow } from "./PropertyRow";

function hasStableEntityId(obj: Record<string, unknown>): boolean {
  const id = obj["@id"];
  return typeof id === "string" && id.length > 0;
}

/**
 * Indexed entity refs as chips when every item exposes `@id`; otherwise renders a vertical
 * list where named items remain chips and anonymous items dispatch inline detail trees.
 */
export function ArrayEntityRenderer({
  label,
  data,
  schema,
  ctx,
}: DetailRendererProps) {
  const { registry, rootSchema } = useDetailRendererContext();

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

  const exclusivelyEntityChips =
    Array.isArray(data) &&
    data.every(
      (item) =>
        item != null &&
        typeof item === "object" &&
        hasStableEntityId(item as Record<string, unknown>),
    );

  if (exclusivelyEntityChips) {
    return (
      <PropertyRow label={label}>
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          {(data as unknown[]).map((item: unknown, index: number) => {
            if (item == null || typeof item !== "object") return null;
            const d = item as Record<string, unknown>;
            const entityIRI = d["@id"] as string;
            const typeIRI = d["@type"];
            return (
              <EntityChip
                key={entityIRI}
                index={index}
                entityIRI={entityIRI}
                typeIRI={typeof typeIRI === "string" ? typeIRI : undefined}
                data={item}
                size="small"
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

    if (hasStableEntityId(d)) {
      const entityIRI = d["@id"] as string;
      return (
        <EntityChip
          key={entityIRI}
          index={index}
          entityIRI={entityIRI}
          typeIRI={typeof typeIRI === "string" ? typeIRI : undefined}
          data={item}
          size="small"
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
