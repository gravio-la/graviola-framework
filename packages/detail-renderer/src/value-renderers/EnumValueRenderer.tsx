import React from "react";
import { Chip } from "@mui/material";
import type { JSONSchema7 } from "json-schema";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

export function formatEnumValue(value: unknown, schema: JSONSchema7): string {
  if (value == null || value === "") return "";
  const match = schema.oneOf?.find(
    (e) => (e as JSONSchema7).const === value,
  ) as JSONSchema7 | undefined;
  return match?.title ?? String(value);
}

export function EnumValueRenderer({ value, schema }: ValueRendererProps) {
  if (value == null || value === "") return null;
  const displayLabel = formatEnumValue(value, schema);
  return <Chip label={displayLabel} size="small" />;
}
