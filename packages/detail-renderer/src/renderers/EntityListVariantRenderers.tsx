import React from "react";
import type { ControlElement } from "@jsonforms/core";
import type {
  DetailRendererProps,
  ViewSize,
} from "@graviola/edb-detail-renderer-core";
import type { JSONSchema7 } from "json-schema";
import { Box, Stack, Typography } from "@mui/material";

import { isEntityLikeData } from "./entityLike";
import {
  ContainedEntityView,
  containedAsFromUiSchema,
} from "./ContainedEntityView";
import { PropertyRow } from "./PropertyRow";
import type { ListVariant } from "./listVariantTesters";

function resolveItemSchema(schema: JSONSchema7): JSONSchema7 | undefined {
  const rawItems = schema.items;
  if (!rawItems || typeof rawItems !== "object" || Array.isArray(rawItems)) {
    return undefined;
  }
  return rawItems as JSONSchema7;
}

function containedAsForVariant(
  variant: ListVariant,
  uiSchema: ControlElement,
): ViewSize {
  if (variant === "cards") return "card";
  if (variant === "listItem" || variant === "searchList") return "listItem";
  if (variant === "chips") return "chip";
  return containedAsFromUiSchema(uiSchema, "chip");
}

function EntityListVariantBody({
  data,
  itemSchema,
  containedAs,
  ctx,
}: {
  data: unknown[];
  itemSchema: JSONSchema7 | undefined;
  containedAs: ViewSize;
  ctx: DetailRendererProps["ctx"];
}) {
  return (
    <Stack
      direction={containedAs === "card" ? "column" : "row"}
      flexWrap={containedAs === "card" ? undefined : "wrap"}
      gap={containedAs === "card" ? 1 : 0.75}
      sx={{ width: containedAs === "card" ? "100%" : undefined }}
    >
      {data.map((item, index) => {
        if (item == null || typeof item !== "object") return null;
        const d = item as Record<string, unknown>;
        if (!isEntityLikeData(d)) return null;
        const key =
          (typeof d["@id"] === "string" && d["@id"]) || `item-${index}`;
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
  );
}

function makeListVariantRenderer(variant: ListVariant) {
  return function ListVariantRenderer({
    label,
    data,
    schema,
    uiSchema,
    ctx,
  }: DetailRendererProps) {
    if (!Array.isArray(data) || data.length === 0) return null;
    const itemSchema = resolveItemSchema(schema as JSONSchema7);
    const containedAs = containedAsForVariant(
      variant,
      uiSchema as ControlElement,
    );
    const body = (
      <EntityListVariantBody
        data={data as unknown[]}
        itemSchema={itemSchema}
        containedAs={containedAs}
        ctx={ctx}
      />
    );

    if (variant === "cards") {
      return (
        <Box sx={{ width: "100%", mt: 1, mb: 1.5 }}>
          {typeof label === "string" && label.trim() ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, mb: 1, display: "block" }}
            >
              {label}
            </Typography>
          ) : null}
          {body}
        </Box>
      );
    }

    return <PropertyRow label={label}>{body}</PropertyRow>;
  };
}

export const EntityListChipsRenderer = makeListVariantRenderer("chips");
export const EntityListCardsRenderer = makeListVariantRenderer("cards");
export const EntityListSearchRenderer = makeListVariantRenderer("searchList");
