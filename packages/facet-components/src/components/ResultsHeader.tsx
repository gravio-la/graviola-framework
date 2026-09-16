import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type ResultsHeaderProps = {
  totalHits: number;
  rangeStart: number;
  rangeEnd: number;
  processingTimeMs?: number;
  approximate?: boolean;
  isFetching?: boolean;
};

export function ResultsHeader({
  totalHits,
  rangeStart,
  rangeEnd,
  processingTimeMs,
  approximate,
  isFetching,
}: ResultsHeaderProps) {
  const capped = totalHits >= 1000;
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {approximate ? "≈" : ""}
        {capped ? "1,000+" : totalHits.toLocaleString()} results
        {rangeStart > 0 ? ` · showing ${rangeStart}–${rangeEnd}` : ""}
        {processingTimeMs != null ? ` · ${processingTimeMs} ms` : ""}
        {isFetching ? " (loading…)" : ""}
      </Typography>
    </Stack>
  );
}
