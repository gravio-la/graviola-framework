import React from "react";
import { Box, Typography } from "@mui/material";
import type { Layout } from "@jsonforms/core";
import {
  childNestingContext,
  readNestingOptions,
  type DetailRendererProps,
} from "@graviola/edb-detail-renderer-core";

import { NestedSection } from "../NestedSection";

export function GroupRenderer({
  uiSchema,
  dispatch,
  ctx,
}: DetailRendererProps) {
  const layout = uiSchema as Layout & { label?: string };
  const elements = layout.elements ?? [];
  const nesting = readNestingOptions(uiSchema, ctx);
  const childCtx = childNestingContext(uiSchema, ctx);

  const children = elements.map((el, i) => (
    <React.Fragment key={i}>
      {dispatch({ uiSchema: el, ctx: childCtx })}
    </React.Fragment>
  ));

  if (nesting.collapsible) {
    return (
      <NestedSection
        label={layout.label || "Group"}
        defaultExpanded={nesting.defaultExpanded ?? true}
        flat={nesting.flat}
      >
        {children}
      </NestedSection>
    );
  }

  return (
    <Box>
      {layout.label ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, mb: 0.5 }}
        >
          {layout.label}
        </Typography>
      ) : null}
      <Box sx={{ pl: layout.label ? 1 : 0 }}>{children}</Box>
    </Box>
  );
}
