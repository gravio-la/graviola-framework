import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FacetBucket } from "@graviola/store-core";
import type { FacetDescriptor, FacetSelection } from "@graviola/facet-core";
import { getScopeSelection } from "@graviola/facet-core";

export type QuickFacetRowProps = {
  descriptors: FacetDescriptor[];
  bucketsByScope: Record<string, FacetBucket[]>;
  selection: FacetSelection;
  onToggle: (scope: string, value: string | number | boolean) => void;
};

export function QuickFacetRow({
  descriptors,
  bucketsByScope,
  selection,
  onToggle,
}: QuickFacetRowProps) {
  const quick = descriptors
    .filter((d) => d.quick)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (quick.length === 0) return null;

  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        Quick filters
      </Typography>
      <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
        {quick.map((d) => {
          const buckets = (bucketsByScope[d.scope] ?? []).slice(0, 12);
          return buckets.map((b) => {
            const sel = getScopeSelection(selection, d.scope);
            const selected =
              sel?.kind === "terms" && sel.values.some((v) => v === b.value);
            return (
              <Chip
                key={`${d.scope}-${String(b.value)}`}
                size="small"
                label={`${b.label ?? b.value} (${b.count})`}
                color={selected ? "primary" : "default"}
                variant={selected ? "filled" : "outlined"}
                onClick={() => onToggle(d.scope, b.value)}
              />
            );
          });
        })}
      </Stack>
    </Stack>
  );
}
