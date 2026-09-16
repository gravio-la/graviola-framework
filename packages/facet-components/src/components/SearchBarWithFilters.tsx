import FilterListIcon from "@mui/icons-material/FilterList";
import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  activeCount,
  getScopeSelection,
  type FacetDescriptor,
  type FacetSelection,
} from "@graviola/facet-core";
import { formatBytes } from "../formatters";

export type SearchBarWithFiltersProps = {
  query: string;
  onQueryChange: (q: string) => void;
  selection: FacetSelection;
  descriptors: FacetDescriptor[];
  onToggleFilters: () => void;
  onClearScope: (scope: string) => void;
  onClearAll: () => void;
  placeholder?: string;
};

function chipLabel(
  descriptor: FacetDescriptor,
  selection: ReturnType<typeof getScopeSelection>,
): string {
  if (!selection) return descriptor.label;
  if (selection.kind === "terms") {
    const vals = selection.values.map(String).join(", ");
    return `${descriptor.label}: ${vals}`;
  }
  const parts: string[] = [];
  if (selection.gte != null) {
    parts.push(
      descriptor.kind === "bytes"
        ? `≥ ${formatBytes(Number(selection.gte))}`
        : `≥ ${selection.gte}`,
    );
  }
  if (selection.lte != null) {
    parts.push(
      descriptor.kind === "bytes"
        ? `≤ ${formatBytes(Number(selection.lte))}`
        : `≤ ${selection.lte}`,
    );
  }
  return `${descriptor.label}: ${parts.join(" ")}`;
}

export function SearchBarWithFilters({
  query,
  onQueryChange,
  selection,
  descriptors,
  onToggleFilters,
  onClearScope,
  onClearAll,
  placeholder = "Search…",
}: SearchBarWithFiltersProps) {
  const count = activeCount(selection);
  const activeChips = descriptors.flatMap((d) => {
    const sel = getScopeSelection(selection, d.scope);
    if (!sel) return [];
    return [{ descriptor: d, sel }];
  });

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <IconButton onClick={onToggleFilters} aria-label="Filters">
          <Badge badgeContent={count} color="primary">
            <FilterListIcon />
          </Badge>
        </IconButton>
      </Stack>
      {activeChips.length > 0 ? (
        <Box display="flex" flexWrap="wrap" gap={0.5} alignItems="center">
          {activeChips.map(({ descriptor, sel }) => (
            <Chip
              key={descriptor.scope}
              size="small"
              label={chipLabel(descriptor, sel)}
              onDelete={() => onClearScope(descriptor.scope)}
            />
          ))}
          <Button size="small" onClick={onClearAll}>
            Clear all
          </Button>
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          No active filters
        </Typography>
      )}
    </Stack>
  );
}
