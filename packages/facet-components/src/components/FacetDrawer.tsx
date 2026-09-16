import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import {
  getScopeSelection,
  isScopeActive,
  type FacetDescriptor,
  type FacetSelection,
} from "@graviola/facet-core";
import type { FacetBucket, FacetStats } from "@graviola/store-core";
import { useMemo } from "react";

import { resolveFacetRenderer, type FacetRendererEntry } from "../registry";

export type FacetDrawerProps = {
  open: boolean;
  onClose: () => void;
  descriptors: FacetDescriptor[];
  bucketsByScope: Record<string, FacetBucket[]>;
  statsByField: Record<string, FacetStats>;
  selection: FacetSelection;
  visibleScopes: string[];
  onToggleScopeVisible: (scope: string) => void;
  onToggleTerm: (scope: string, value: string | number | boolean) => void;
  onSetRange: (
    scope: string,
    gte?: number | string,
    lte?: number | string,
  ) => void;
  totalHits: number;
  processingTimeMs?: number;
  approximate?: boolean;
  isFetching?: boolean;
  extraRenderers?: FacetRendererEntry[];
};

export function FacetDrawer({
  open,
  onClose,
  descriptors,
  bucketsByScope,
  statsByField,
  selection,
  visibleScopes,
  onToggleScopeVisible,
  onToggleTerm,
  onSetRange,
  totalHits,
  processingTimeMs,
  approximate,
  isFetching,
  extraRenderers,
}: FacetDrawerProps) {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const sorted = useMemo(
    () => [...descriptors].sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
    [descriptors],
  );

  const content = (
    <Box sx={{ width: isMd ? 360 : "100vw", p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="subtitle1">
          {approximate ? "≈" : ""}
          {totalHits.toLocaleString()} results
          {processingTimeMs != null ? ` · ${processingTimeMs} ms` : ""}
        </Typography>
        {!isMd ? (
          <IconButton onClick={onClose} aria-label="Close filters">
            <CloseIcon />
          </IconButton>
        ) : null}
      </Stack>
      <Stack spacing={2}>
        {sorted.map((d) => {
          const expanded = visibleScopes.includes(d.scope);
          const active = isScopeActive(selection, d.scope);
          const buckets = bucketsByScope[d.scope] ?? [];
          const entry = resolveFacetRenderer(d, buckets, extraRenderers);
          const sel = getScopeSelection(selection, d.scope);
          const selectedValues = sel?.kind === "terms" ? sel.values : [];
          const range = sel?.kind === "range" ? sel : undefined;

          return (
            <Box key={d.scope}>
              <Typography
                variant="subtitle2"
                sx={{ cursor: "pointer", mb: 1 }}
                onClick={() => onToggleScopeVisible(d.scope)}
              >
                {d.label}
                {active ? " •" : ""}
              </Typography>
              {!expanded ? null : isFetching && buckets.length === 0 ? (
                <Skeleton height={48} />
              ) : entry ? (
                <entry.Component
                  descriptor={d}
                  buckets={buckets}
                  selectedValues={selectedValues}
                  range={range}
                  stats={statsByField[d.field]}
                  onToggle={(v) => onToggleTerm(d.scope, v)}
                  onSetRange={(gte, lte) => onSetRange(d.scope, gte, lte)}
                  disabled={
                    d.mode === "range" &&
                    d.valueType === "date-time" &&
                    !d.numericField
                  }
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No renderer
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );

  return (
    <Drawer
      variant={isMd ? "persistent" : "temporary"}
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
    >
      {content}
    </Drawer>
  );
}
