import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type {
  JsonLdEntity,
  ResultListController,
} from "@graviola/edb-state-hooks";
import { Button, Stack, Typography } from "@mui/material";

type ResultListHeaderProps<T extends JsonLdEntity = JsonLdEntity> = {
  controller: ResultListController<T>;
};

export function ResultListHeader<T extends JsonLdEntity = JsonLdEntity>({
  controller,
}: ResultListHeaderProps<T>) {
  const {
    totalHits,
    processingTimeMs,
    query,
    rangeStart,
    rangeEnd,
    page,
    totalPages,
    canGoPrev,
    canGoNext,
    isFetching,
    onPageChange,
  } = controller;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ sm: "center" }}
      justifyContent="space-between"
      sx={{ mb: 2 }}
    >
      <Typography variant="body2" color="text.secondary">
        {totalHits.toLocaleString()} hit(s)
        {processingTimeMs != null ? ` · ${processingTimeMs} ms` : null}
        {query ? ` · query “${query}”` : null}
        {totalHits > 0
          ? ` · showing ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()}`
          : null}
      </Typography>
      {totalHits > 0 ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            startIcon={<ChevronLeftIcon />}
            disabled={!canGoPrev || isFetching}
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            Previous
          </Button>
          <Typography variant="body2" color="text.secondary">
            Page {page + 1} of {totalPages.toLocaleString()}
          </Typography>
          <Button
            size="small"
            endIcon={<ChevronRightIcon />}
            disabled={!canGoNext || isFetching}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
