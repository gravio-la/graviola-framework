import React from "react";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

import { CompactNumericSpan } from "../components/CompactNumericSpan";

export function formatLocalizedNumber(
  value: unknown,
  options?: Record<string, unknown>,
): string {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  const locale =
    typeof options?.locale === "string" ? options.locale : undefined;
  const minimumFractionDigits =
    typeof options?.minimumFractionDigits === "number"
      ? options.minimumFractionDigits
      : undefined;
  return n.toLocaleString(locale, { minimumFractionDigits });
}

export function LocalizedNumberValueRenderer({
  value,
  options,
}: ValueRendererProps) {
  if (value == null || value === "") return null;
  return (
    <CompactNumericSpan>
      {formatLocalizedNumber(value, options)}
    </CompactNumericSpan>
  );
}
