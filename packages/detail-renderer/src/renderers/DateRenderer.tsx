import React from "react";
import { Typography } from "@mui/material";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import {
  formatDateTimeValue,
  formatDateValue,
} from "../value-renderers/DateValueRenderer";
import { renderValueWithRow } from "../value-renderers/renderValue";

function dateFallback({ data }: DetailRendererProps) {
  return (
    <Typography variant="inherit" component="span">
      {formatDateValue(data)}
    </Typography>
  );
}

export function DateRenderer(props: DetailRendererProps) {
  return renderValueWithRow(props, dateFallback);
}

function dateTimeFallback({ data }: DetailRendererProps) {
  return (
    <Typography variant="inherit" component="span">
      {formatDateTimeValue(data)}
    </Typography>
  );
}

export function DateTimeRenderer(props: DetailRendererProps) {
  return renderValueWithRow(props, dateTimeFallback);
}
