import React from "react";
import { Typography } from "@mui/material";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { PropertyRow } from "./PropertyRow";

export function NumberRenderer({ label, data }: DetailRendererProps) {
  if (data == null) return null;
  const n = Number(data);
  const display = isNaN(n) ? String(data) : n.toLocaleString();
  return (
    <PropertyRow label={label}>
      <Typography variant="body2">{display}</Typography>
    </PropertyRow>
  );
}
