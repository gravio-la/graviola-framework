import React from "react";
import { Typography } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

/**
 * Minimal historian-style display; apps override via custom `ValueRendererEntry`.
 */
export function formatHistoricalDate(
  value: unknown,
  options?: Record<string, unknown>,
): string {
  if (value == null || value === "") return "";

  const precision = options?.precision;
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    const year = o.year ?? o.startYear;
    if (precision === "century" && typeof year === "number") {
      const c = Math.floor((year - 1) / 100) + 1;
      return `${c}. Jh.`;
    }
    if (typeof year === "number") {
      return precision === "decade"
        ? `~${Math.floor(year / 10) * 10}`
        : `~${year}`;
    }
  }

  const n = Number(value);
  if (!Number.isNaN(n) && precision === "century") {
    const c = Math.floor((n - 1) / 100) + 1;
    return `${c}. Jh.`;
  }
  if (!Number.isNaN(n)) return `~${n}`;

  return String(value);
}

export function HistoricalDateValueRenderer({
  value,
  options,
}: ValueRendererProps) {
  if (value == null || value === "") return null;
  return (
    <Typography variant="inherit" component="span">
      {formatHistoricalDate(value, options)}
    </Typography>
  );
}
