import React from "react";
import { Typography } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

import { CompactNumericSpan } from "../components/CompactNumericSpan";
import { useDetailPresentation } from "../detailPresentationContext";

const NUMERIC_DETAIL_STRING_PATTERN = /^[\d\s.,/½¼¾⅓⅔⅛⅜⅝⅞-]+$/;

export function looksLikeNumericDetailString(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return NUMERIC_DETAIL_STRING_PATTERN.test(trimmed);
}

export function formatFallbackString(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function FallbackStringValueRenderer({ value }: ValueRendererProps) {
  const { compactNumericColumn } = useDetailPresentation();
  if (value == null || value === "") return null;
  const text = formatFallbackString(value);
  if (
    compactNumericColumn &&
    typeof value === "string" &&
    looksLikeNumericDetailString(value)
  ) {
    return <CompactNumericSpan>{text}</CompactNumericSpan>;
  }
  return (
    <Typography variant="inherit" component="span">
      {text}
    </Typography>
  );
}
