import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { FacetRendererProps } from "../registry";

export function TermsChipsFacet({
  descriptor,
  buckets,
  selectedValues,
  onToggle,
}: FacetRendererProps) {
  return (
    <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
      {buckets.map((b) => {
        const selected = selectedValues.some((v) => v === b.value);
        const label = b.label ?? String(b.value);
        return (
          <Chip
            key={`${descriptor.scope}-${String(b.value)}`}
            label={
              <Typography component="span" variant="body2">
                {label}{" "}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  ({b.count})
                </Typography>
              </Typography>
            }
            color={selected ? "primary" : "default"}
            variant={selected ? "filled" : "outlined"}
            onClick={() => onToggle(b.value)}
            size="small"
          />
        );
      })}
    </Stack>
  );
}

export const termsChipsTester = (
  descriptor: { mode: string; valueType: string },
  buckets: unknown[],
): number => {
  if (descriptor.mode !== "filter") return 0;
  if (descriptor.valueType === "boolean") return 0;
  if (buckets.length > 30) return 0;
  return 3;
};
