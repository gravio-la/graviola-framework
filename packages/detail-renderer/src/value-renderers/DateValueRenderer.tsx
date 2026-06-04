import React from "react";
import { Typography } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

function parseDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function readLocale(options?: Record<string, unknown>): string | undefined {
  return typeof options?.locale === "string" ? options.locale : undefined;
}

export function formatDateValue(
  value: unknown,
  options?: Record<string, unknown>,
): string {
  const date = parseDate(value);
  if (!date) return value == null || value === "" ? "" : String(value);
  return new Intl.DateTimeFormat(readLocale(options), {
    dateStyle: "medium",
  }).format(date);
}

export function DateValueRenderer({ value, options }: ValueRendererProps) {
  if (value == null || value === "") return null;
  return (
    <Typography variant="inherit" component="span">
      {formatDateValue(value, options)}
    </Typography>
  );
}

export function formatDateTimeValue(
  value: unknown,
  options?: Record<string, unknown>,
): string {
  const date = parseDate(value);
  if (!date) return value == null || value === "" ? "" : String(value);
  return new Intl.DateTimeFormat(readLocale(options), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function DateTimeValueRenderer({ value, options }: ValueRendererProps) {
  if (value == null || value === "") return null;
  return (
    <Typography variant="inherit" component="span">
      {formatDateTimeValue(value, options)}
    </Typography>
  );
}
