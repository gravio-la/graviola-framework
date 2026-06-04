import React from "react";
import { Typography } from "@mui/material";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { formatLocalizedNumber } from "../value-renderers/LocalizedNumberValueRenderer";
import { renderValueWithRow } from "../value-renderers/renderValue";

function numberFallback({ data }: DetailRendererProps) {
  return (
    <Typography variant="inherit" component="span">
      {formatLocalizedNumber(data)}
    </Typography>
  );
}

export function NumberRenderer(props: DetailRendererProps) {
  return renderValueWithRow(props, numberFallback);
}
