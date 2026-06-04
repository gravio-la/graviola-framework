import { CircularProgress, Stack, Typography } from "@mui/material";
import type {
  InfiniteResultListController,
  JsonLdEntity,
} from "@graviola/edb-state-hooks";

type InfiniteResultListHeaderProps<T extends JsonLdEntity = JsonLdEntity> = {
  controller: InfiniteResultListController<T>;
};

export function InfiniteResultListHeader<
  T extends JsonLdEntity = JsonLdEntity,
>({ controller }: InfiniteResultListHeaderProps<T>) {
  const {
    totalHits,
    loadedCount,
    processingTimeMs,
    query,
    isFetchingNextPage,
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
          ? ` · loaded ${loadedCount.toLocaleString()} of ${totalHits.toLocaleString()}`
          : null}
      </Typography>
      {isFetchingNextPage ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Loading more…
          </Typography>
        </Stack>
      ) : null}
    </Stack>
  );
}
