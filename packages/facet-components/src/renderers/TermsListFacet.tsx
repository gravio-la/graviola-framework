import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import type { FacetRendererProps } from "../registry";

export function TermsListFacet({
  descriptor,
  buckets,
  selectedValues,
  onToggle,
}: FacetRendererProps) {
  const [filter, setFilter] = useState("");
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return buckets.slice(0, 50);
    return buckets
      .filter((b) => {
        const label = (b.label ?? String(b.value)).toLowerCase();
        return label.includes(q) || String(b.value).toLowerCase().includes(q);
      })
      .slice(0, 50);
  }, [buckets, filter]);

  return (
    <Stack spacing={1}>
      <TextField
        size="small"
        placeholder="Filter values…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {visible.map((b) => {
        const label = b.label ?? String(b.value);
        const checked = selectedValues.some((v) => v === b.value);
        return (
          <FormControlLabel
            key={`${descriptor.scope}-${String(b.value)}`}
            control={
              <Checkbox
                size="small"
                checked={checked}
                onChange={() => onToggle(b.value)}
              />
            }
            label={
              <Typography variant="body2">
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
          />
        );
      })}
      {buckets.length > visible.length ? (
        <Typography variant="caption" color="text.secondary">
          Showing {visible.length} of {buckets.length}
        </Typography>
      ) : null}
    </Stack>
  );
}

export const termsListTester = (
  descriptor: { mode: string },
  buckets: unknown[],
): number => {
  if (descriptor.mode !== "filter") return 0;
  return buckets.length > 30 ? 4 : 0;
};
