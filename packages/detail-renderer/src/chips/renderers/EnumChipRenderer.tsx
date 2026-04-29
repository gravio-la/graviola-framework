import React from "react";
import { Chip } from "@mui/material";
import type { JSONSchema7 } from "json-schema";
import type { ChipRendererProps } from "@graviola/edb-detail-renderer-core";

export function EnumChipRenderer({
  schema,
  data,
  definition,
  onClick,
  variant,
}: ChipRendererProps) {
  if (data == null || data === "") return null;
  const s = schema as JSONSchema7;
  const match = s.oneOf?.find((e) => (e as JSONSchema7).const === data) as
    | JSONSchema7
    | undefined;
  const displayLabel = match?.title ?? String(data);
  // Optionally use x-color custom keyword
  const color = (match as any)?.["x-color"] ?? undefined;

  if (variant === "label") {
    return (
      <span style={{ color: color ?? "inherit", fontSize: "0.75rem" }}>
        {displayLabel}
      </span>
    );
  }

  return (
    <Chip
      label={displayLabel}
      size="small"
      sx={color ? { bgcolor: color, color: "white" } : undefined}
      onClick={onClick}
    />
  );
}
