import React from "react";
import { Stack } from "@mui/material";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

export function HorizontalLayoutRenderer({
  uiSchema,
  dispatch,
  ctx,
}: DetailRendererProps) {
  const layout = uiSchema as Layout;
  const elements = layout.elements ?? [];
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {elements.map((el, i) => (
        <React.Fragment key={i}>
          {dispatch({ uiSchema: el, ctx })}
        </React.Fragment>
      ))}
    </Stack>
  );
}
