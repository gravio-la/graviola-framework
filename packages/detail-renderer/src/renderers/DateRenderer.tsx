import React from "react";
import { Typography } from "@mui/material";
import dayjs from "dayjs";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { PropertyRow } from "./PropertyRow";

export function DateRenderer({ label, data }: DetailRendererProps) {
  if (data == null || data === "") return null;
  const parsed = dayjs(String(data));
  const display = parsed.isValid() ? parsed.format("LL") : String(data);
  return (
    <PropertyRow label={label}>
      <Typography variant="body2">{display}</Typography>
    </PropertyRow>
  );
}

export function DateTimeRenderer({ label, data }: DetailRendererProps) {
  if (data == null || data === "") return null;
  const parsed = dayjs(String(data));
  const display = parsed.isValid() ? parsed.format("LLL") : String(data);
  return (
    <PropertyRow label={label}>
      <Typography variant="body2">{display}</Typography>
    </PropertyRow>
  );
}
