import React from "react";
import { Checkbox } from "@mui/material";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { PropertyRow } from "./PropertyRow";

export function BooleanRenderer({ label, data }: DetailRendererProps) {
  if (data == null) return null;
  return (
    <PropertyRow label={label}>
      <Checkbox
        checked={data === true || data === "true"}
        indeterminate={data == null || data === ""}
        disabled
        size="small"
        sx={{ p: 0 }}
      />
    </PropertyRow>
  );
}
