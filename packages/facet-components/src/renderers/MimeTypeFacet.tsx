import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";

import type { FacetRendererProps } from "../registry";

const GROUPS: Record<string, RegExp> = {
  Images: /^image\//,
  Audio: /^audio\//,
  Video: /^video\//,
  Documents: /^(application\/pdf|text\/)/,
  Archives: /^(application\/zip|application\/x-|application\/gzip)/,
};

function majorGroup(mime: string): string {
  for (const [name, re] of Object.entries(GROUPS)) {
    if (re.test(mime)) return name;
  }
  if (mime.startsWith("inode/")) return "Folders";
  return "Other";
}

export function MimeTypeFacet({
  descriptor,
  buckets,
  selectedValues,
  onToggle,
}: FacetRendererProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof buckets>();
    for (const b of buckets) {
      const mime = String(b.value);
      const g = majorGroup(mime);
      const list = map.get(g) ?? [];
      list.push(b);
      map.set(g, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [buckets]);

  return (
    <Stack spacing={1}>
      {grouped.map(([group, items]) => {
        const groupCount = items.reduce((n, b) => n + b.count, 0);
        return (
          <Accordion key={group} disableGutters elevation={0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">
                {group}{" "}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  ({groupCount})
                </Typography>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
                {items.map((b) => {
                  const selected = selectedValues.some((v) => v === b.value);
                  return (
                    <Chip
                      key={`${descriptor.scope}-${String(b.value)}`}
                      size="small"
                      label={`${b.value} (${b.count})`}
                      color={selected ? "primary" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      onClick={() => onToggle(b.value)}
                    />
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}

export const mimeTypeTester = (
  descriptor: { kind?: string },
  _buckets: unknown[],
): number => (descriptor.kind === "mimeType" ? 10 : 0);
