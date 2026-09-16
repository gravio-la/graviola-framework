import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { FacetRendererProps } from "../registry";

const presets = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "1 year", days: 365 },
];

export function DateRangeFacet({
  descriptor,
  range,
  onSetRange,
  disabled,
}: FacetRendererProps) {
  const needsEpoch =
    descriptor.valueType === "date-time" && !descriptor.numericField;

  return (
    <Stack spacing={1.5}>
      {needsEpoch ? (
        <Typography variant="caption" color="warning.main">
          Date range requires numeric index field (
          {descriptor.numericField ?? "missing"}).
        </Typography>
      ) : null}
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {presets.map((p) => (
          <Button
            key={p.label}
            size="small"
            variant="outlined"
            disabled={disabled || needsEpoch}
            onClick={() => {
              const lte = new Date().toISOString();
              const gte = new Date(
                Date.now() - p.days * 86400000,
              ).toISOString();
              onSetRange(gte, lte);
            }}
          >
            {p.label}
          </Button>
        ))}
      </Stack>
      <TextField
        size="small"
        label="From"
        type="datetime-local"
        disabled={disabled || needsEpoch}
        value={typeof range?.gte === "string" ? range.gte.slice(0, 16) : ""}
        onChange={(e) =>
          onSetRange(
            e.target.value ? new Date(e.target.value).toISOString() : undefined,
            typeof range?.lte === "string" ? range.lte : undefined,
          )
        }
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        size="small"
        label="To"
        type="datetime-local"
        disabled={disabled || needsEpoch}
        value={typeof range?.lte === "string" ? range.lte.slice(0, 16) : ""}
        onChange={(e) =>
          onSetRange(
            typeof range?.gte === "string" ? range.gte : undefined,
            e.target.value ? new Date(e.target.value).toISOString() : undefined,
          )
        }
        InputLabelProps={{ shrink: true }}
      />
    </Stack>
  );
}

export const dateRangeTester = (
  descriptor: {
    mode: string;
    valueType: string;
    kind?: string;
  },
  _buckets: unknown[],
): number =>
  descriptor.mode === "range" &&
  (descriptor.valueType === "date-time" || descriptor.kind === "date")
    ? 6
    : 0;
