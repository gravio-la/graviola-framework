import React from "react";
import { Box } from "@mui/material";
import type { ControlElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import {
  childArticleContext,
  extendPropertyScope,
  type DetailRendererProps,
} from "@graviola/edb-detail-renderer-core";

import { ArticleSection } from "./ArticleSection";

/**
 * Inline (anonymous) object under article presentation: heading + flat body.
 */
export function ArticleObjectRenderer({
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

  const childCtx = childArticleContext(ctx);
  const parentScope = (uiSchema as ControlElement).scope ?? "#";
  const children = Object.entries(s.properties)
    .filter(([key]) => !key.startsWith("@"))
    .map(([key]) => {
      const childScope = extendPropertyScope(parentScope, key);
      const childUi: ControlElement = {
        type: "Control",
        scope: childScope,
      };
      return dispatch({ uiSchema: childUi, ctx: childCtx });
    })
    .filter(Boolean);

  if (children.length === 0) return null;

  const headingLevel = ctx.headingLevel ?? 2;
  const showHeading = typeof label === "string" && label.trim().length > 0;

  if (showHeading) {
    return (
      <ArticleSection label={label} headingLevel={headingLevel}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {children}
        </Box>
      </ArticleSection>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {children}
    </Box>
  );
}
