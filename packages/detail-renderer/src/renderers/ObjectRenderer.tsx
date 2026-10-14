import React from "react";
import { Box, Typography } from "@mui/material";
import type { ControlElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import {
  extendPropertyScope,
  readNestingOptions,
  childNestingContext,
} from "@graviola/edb-detail-renderer-core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { DetailSectionHeading } from "../components/DetailSectionHeading";
import { DetailPresentationProvider } from "../detailPresentationContext";
import { isCompactLeafObjectSchema } from "../utils/detailSchemaPresentation";
import { NestedSection } from "./NestedSection";

export function ObjectRenderer({
  label,
  schema,
  data,
  uiSchema,
  dispatch,
  ctx,
}: DetailRendererProps) {
  if (data == null || typeof data !== "object") return null;
  const s = schema as JSONSchema7;
  if (!s.properties) return null;

  const nesting = readNestingOptions(uiSchema, ctx);
  const childCtx = childNestingContext(uiSchema, ctx);
  const parentScope = (uiSchema as ControlElement).scope ?? "#";
  const propertyEntries = Object.entries(s.properties).filter(
    ([key]) => !key.startsWith("@"),
  );

  const children = propertyEntries
    .map(([key]) => {
      const childScope = extendPropertyScope(parentScope, key);
      const childUi: ControlElement = {
        type: "Control",
        scope: childScope,
      };
      return (
        <React.Fragment key={childScope}>
          {dispatch({ uiSchema: childUi, ctx: childCtx })}
        </React.Fragment>
      );
    })
    .filter(Boolean);

  if (children.length === 0) return null;

  const isDetail = !ctx.viewSize || ctx.viewSize === "detail";
  const topSection = isDetail && ctx.depth === 0 && label.trim().length > 0;
  const compact =
    isDetail && isCompactLeafObjectSchema(s) && !nesting.collapsible;

  if (nesting.collapsible) {
    return (
      <NestedSection
        label={
          topSection ? (
            <DetailSectionHeading>{label}</DetailSectionHeading>
          ) : (
            label
          )
        }
        defaultExpanded={nesting.defaultExpanded ?? true}
        flat={nesting.flat}
      >
        {children}
      </NestedSection>
    );
  }

  if (compact) {
    const hideInlineLabels = propertyEntries.length <= 3;
    const visibleChildren = children.filter(Boolean);
    return (
      <Box>
        {topSection ? (
          <DetailSectionHeading>{label}</DetailSectionHeading>
        ) : label.trim() ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
          >
            {label}
          </Typography>
        ) : null}
        <DetailPresentationProvider
          value={{ compactLeafInline: true, hideInlineLabels }}
        >
          <Box
            className="graviola-detail-compact-object"
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              gap: hideInlineLabels ? 0 : 2,
            }}
          >
            {hideInlineLabels
              ? visibleChildren.flatMap((child, index) =>
                  index === 0
                    ? [child]
                    : [
                        <Box
                          component="span"
                          key={`sep-${index}`}
                          sx={{ mx: 0.75, color: "text.secondary" }}
                          aria-hidden
                        >
                          ·
                        </Box>,
                        child,
                      ],
                )
              : visibleChildren}
          </Box>
        </DetailPresentationProvider>
      </Box>
    );
  }

  if (topSection) {
    return (
      <Box>
        <DetailSectionHeading>{label}</DetailSectionHeading>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          pl: 2,
          borderLeft: "2px solid",
          borderColor: "divider",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
