import React from "react";
import { Typography } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

export function formatFallbackString(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function FallbackStringValueRenderer({ value }: ValueRendererProps) {
  if (value == null || value === "") return null;
  return (
    <Typography variant="inherit" component="span">
      {formatFallbackString(value)}
    </Typography>
  );
}
