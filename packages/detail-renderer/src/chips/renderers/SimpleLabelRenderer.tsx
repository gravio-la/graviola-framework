import React from "react";
import { Chip, Typography } from "@mui/material";
import type { ChipRendererProps } from "@graviola/edb-detail-renderer-core";

export function SimpleLabelRenderer({
  data,
  definition,
  onClick,
  variant,
}: ChipRendererProps) {
  if (data == null || data === "") return null;
  const label = definition.label(data, {} as any) ?? String(data);

  if (variant === "label") {
    return <Typography variant="caption">{label}</Typography>;
  }

  return <Chip label={label} size="small" onClick={onClick} />;
}
