import React from "react";
import { Box, Typography } from "@mui/material";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

export function GroupRenderer({
  uiSchema,
  dispatch,
  ctx,
}: DetailRendererProps) {
  const layout = uiSchema as Layout & { label?: string };
  const elements = layout.elements ?? [];
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
      <Box sx={{ pl: layout.label ? 1 : 0 }}>
        {elements.map((el, i) => (
          <React.Fragment key={i}>
            {dispatch({ uiSchema: el, ctx })}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}
