import React from "react";
import { Typography } from "@mui/material";
import type { LabelElement } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

export function LabelRenderer({ uiSchema }: DetailRendererProps) {
  const label = uiSchema as LabelElement;
  return (
    <Typography
      variant="overline"
      color="text.secondary"
      display="block"
      sx={{ mt: 1 }}
    >
      {label.text}
    </Typography>
  );
}
