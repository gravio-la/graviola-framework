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
  const children = Object.entries(s.properties)
    .filter(([key]) => !key.startsWith("@"))
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

  if (nesting.collapsible) {
    return (
      <NestedSection
        label={label}
        defaultExpanded={nesting.defaultExpanded ?? true}
        flat={nesting.flat}
      >
        {children}
      </NestedSection>
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
