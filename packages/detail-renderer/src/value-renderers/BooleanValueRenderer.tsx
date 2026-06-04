import React from "react";
import { Checkbox } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

export function BooleanValueRenderer({ value }: ValueRendererProps) {
  if (value == null) return null;
  return (
    <Checkbox
      checked={value === true || value === "true"}
      indeterminate={value === ""}
      disabled
      size="small"
      sx={{ p: 0, verticalAlign: "middle" }}
    />
  );
}
