import React from "react";
import { Chip, Stack } from "@mui/material";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { PropertyRow } from "./PropertyRow";

export function ArrayPrimitiveRenderer({ label, data }: DetailRendererProps) {
  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <PropertyRow label={label}>
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {data.map((item: unknown, index: number) => (
          <Chip
            key={`${String(item)}-${index}`}
            label={String(item)}
            size="small"
          />
        ))}
      </Stack>
    </PropertyRow>
  );
}
