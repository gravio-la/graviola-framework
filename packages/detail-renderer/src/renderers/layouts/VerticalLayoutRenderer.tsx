import React from "react";
import { Stack } from "@mui/material";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

export function VerticalLayoutRenderer({
  uiSchema,
  dispatch,
  ctx,
}: DetailRendererProps) {
  const layout = uiSchema as Layout;
  const elements = layout.elements ?? [];
  return (
    <Stack spacing={0.5}>
      {elements.map((el, i) => (
        <React.Fragment key={i}>
          {dispatch({ uiSchema: el, ctx })}
        </React.Fragment>
      ))}
    </Stack>
  );
}
