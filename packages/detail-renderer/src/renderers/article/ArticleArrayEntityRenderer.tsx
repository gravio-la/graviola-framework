import React from "react";
import { Box, Stack } from "@mui/material";
import type { ControlElement } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import {
  childArticleContext,
  isSectionWorthyObjectSchema,
} from "@graviola/edb-detail-renderer-core";
import { extractEntityPreview } from "@graviola/edb-core-utils";
import type { JSONSchema7 } from "json-schema";

import { useDetailRendererContext } from "../../context";
import {
  ContainedEntityView,
  containedAsFromUiSchema,
} from "../ContainedEntityView";
import { isEntityLikeData } from "../entityLike";
import { ArticleSection } from "./ArticleSection";

/**
 * Entity arrays under article presentation.
 * Section-worthy items get a sub-heading from their preview label; otherwise
 * fall back to the contained listItem/chip view.
 */
export function ArticleArrayEntityRenderer({
  label,
  data,
  schema,
  uiSchema,
  ctx,
}: DetailRendererProps) {
  const { config } = useDetailRendererContext();
  const containedAs = containedAsFromUiSchema(
    uiSchema as ControlElement,
    "listItem",
  );

  if (!Array.isArray(data) || data.length === 0) return null;

  const rawItems = (schema as JSONSchema7).items;
  const itemSchema =
    rawItems && typeof rawItems === "object" && rawItems !== null
      ? (rawItems as JSONSchema7)
      : undefined;

  const headingLevel = ctx.headingLevel ?? 2;
  const showHeading = typeof label === "string" && label.trim().length > 0;
  const itemCtx = childArticleContext(ctx);
  const itemHeadingLevel = itemCtx.headingLevel ?? headingLevel + 1;

  const expandItems =
    itemSchema != null && isSectionWorthyObjectSchema(itemSchema);

  const body = expandItems ? (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {(data as unknown[]).map((item: unknown, index: number) => {
        if (item == null || typeof item !== "object") return null;
        const d = item as Record<string, unknown>;
        if (!isEntityLikeData(d)) return null;
        const typeName =
          typeof d["@type"] === "string" && ctx.typeIRIToTypeName
            ? ctx.typeIRIToTypeName(d["@type"] as string)
            : ctx.typeName;
        const preview = typeName
          ? extractEntityPreview({
              data: d,
              typeName,
              primaryFields: config.primaryFields as
                | import("@graviola/edb-core-types").PrimaryFieldDeclaration
                | undefined,
            })
          : null;
        const itemLabel = preview?.label ?? `Item ${index + 1}`;
        const key =
          (typeof d["@id"] === "string" && d["@id"]) || `item-${index}`;
        return (
          <ArticleSection
            key={key}
            label={itemLabel}
            headingLevel={itemHeadingLevel}
          >
            <ContainedEntityView
              data={d}
              schema={itemSchema}
              containedAs="listItem"
              ctx={itemCtx}
            />
          </ArticleSection>
        );
      })}
    </Box>
  ) : (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={containedAs === "card" ? 1.5 : 0.5}
    >
      {(data as unknown[]).map((item: unknown, index: number) => {
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

  if (!showHeading) return body;

  return (
    <ArticleSection label={label} headingLevel={headingLevel}>
      {body}
    </ArticleSection>
  );
}
