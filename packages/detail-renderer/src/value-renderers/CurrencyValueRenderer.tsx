import React from "react";
import { Typography } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

export function formatCurrencyValue(
  value: unknown,
  options?: Record<string, unknown>,
): string {
  const currency =
    typeof options?.currency === "string" ? options.currency : undefined;
  if (!currency) return String(value ?? "");

  const locale =
    typeof options?.locale === "string" ? options.locale : undefined;
  const unit = options?.unit === "minor" ? "minor" : "major";

  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");

  const amount = unit === "minor" ? n / 100 : n;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function CurrencyValueRenderer({ value, options }: ValueRendererProps) {
  if (value == null || value === "") return null;
  return (
    <Typography variant="inherit" component="span">
      {formatCurrencyValue(value, options)}
    </Typography>
  );
}
