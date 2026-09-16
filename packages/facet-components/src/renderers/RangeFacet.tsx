import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { formatBytes } from "../formatters";
import type { FacetRendererProps } from "../registry";

export function RangeFacet({
  descriptor,
  range,
  stats,
  onSetRange,
  disabled,
}: FacetRendererProps) {
  const min = stats?.min ?? 0;
  const max = stats?.max ?? min + 1;
  const isBytes = descriptor.kind === "bytes";
  const [local, setLocal] = useState<[number, number]>([
    typeof range?.gte === "number" ? range.gte : min,
    typeof range?.lte === "number" ? range.lte : max,
  ]);

  useEffect(() => {
    setLocal([
      typeof range?.gte === "number" ? range.gte : min,
      typeof range?.lte === "number" ? range.lte : max,
    ]);
  }, [range?.gte, range?.lte, min, max]);

  const fmt = (n: number) => (isBytes ? formatBytes(n) : String(n));

  return (
    <Stack spacing={2}>
      <Typography variant="caption" color="text.secondary">
        {fmt(min)} – {fmt(max)}
      </Typography>
      <Slider
        value={local}
        min={min}
        max={max}
        disabled={disabled || min >= max}
        onChange={(_, v) => setLocal(v as [number, number])}
        onChangeCommitted={(_, v) => {
          const [gte, lte] = v as [number, number];
          onSetRange(gte, lte);
        }}
        valueLabelDisplay="auto"
        valueLabelFormat={fmt}
      />
      <Box display="flex" gap={1}>
        <TextField
          size="small"
          label="Min"
          type="number"
          disabled={disabled}
          value={local[0]}
          onChange={(e) => setLocal([Number(e.target.value), local[1]])}
          onBlur={() => onSetRange(local[0], local[1])}
          fullWidth
        />
        <TextField
          size="small"
          label="Max"
          type="number"
          disabled={disabled}
          value={local[1]}
          onChange={(e) => setLocal([local[0], Number(e.target.value)])}
          onBlur={() => onSetRange(local[0], local[1])}
          fullWidth
        />
      </Box>
    </Stack>
  );
}

export const rangeTester = (
  descriptor: { mode: string; valueType: string },
  _buckets: unknown[],
): number =>
  descriptor.mode === "range" && descriptor.valueType !== "date-time" ? 5 : 0;
