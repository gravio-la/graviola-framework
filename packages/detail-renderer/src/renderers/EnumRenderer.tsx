import React from "react";
import { Chip } from "@mui/material";
import type { JSONSchema7 } from "json-schema";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { PropertyRow } from "./PropertyRow";

export function EnumRenderer({ label, data, schema }: DetailRendererProps) {
  if (data == null || data === "") return null;
  const s = schema as JSONSchema7;
  const match = s.oneOf?.find((e) => (e as JSONSchema7).const === data) as
    | JSONSchema7
    | undefined;
  const displayLabel = match?.title ?? String(data);
  return (
    <PropertyRow label={label}>
      <Chip label={displayLabel} size="small" />
    </PropertyRow>
  );
}
