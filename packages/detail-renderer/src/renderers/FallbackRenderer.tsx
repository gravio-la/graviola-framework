import React from "react";
import { Typography } from "@mui/material";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { PropertyRow } from "./PropertyRow";

export function FallbackRenderer({ label, data }: DetailRendererProps) {
  if (data == null || data === "") return null;
  const display =
    typeof data === "string" || typeof data === "number"
      ? String(data)
      : JSON.stringify(data);
  return (
    <PropertyRow label={label}>
      <Typography variant="body2">{display}</Typography>
    </PropertyRow>
  );
}
