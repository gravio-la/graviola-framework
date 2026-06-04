import React from "react";
import { Typography } from "@mui/material";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { formatFallbackString } from "../value-renderers/FallbackStringValueRenderer";
import { renderValueWithRow } from "../value-renderers/renderValue";

function stringFallback({ data }: DetailRendererProps) {
  return (
    <Typography variant="inherit" component="span">
      {formatFallbackString(data)}
    </Typography>
  );
}

export function FallbackRenderer(props: DetailRendererProps) {
  return renderValueWithRow(props, stringFallback);
}
