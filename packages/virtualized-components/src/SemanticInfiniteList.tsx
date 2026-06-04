import { useCallback } from "react";
import type { DetailViewConfig } from "@graviola/edb-detail-renderer-core";
import type {
  InfiniteResultListController,
  JsonLdEntity,
} from "@graviola/edb-state-hooks";
import { Alert, Box, CircularProgress } from "@mui/material";
import { Virtuoso } from "react-virtuoso";
import { InfiniteResultListHeader } from "./InfiniteResultListHeader";
import { SemanticListRow } from "./SemanticListRow";
import type { ListTypeMode } from "./listTypes";
import { useDefaultOpenDetail } from "./useDefaultOpenDetail";

export type SemanticInfiniteListProps<T extends JsonLdEntity = JsonLdEntity> = {
  controller: InfiniteResultListController<T>;
  typeMode: ListTypeMode;
  config?: Partial<DetailViewConfig>;
  onOpenDetail?: (doc: T) => void;
  height?: string | number;
  showHeader?: boolean;
  emptyMessage?: string;
};

export function SemanticInfiniteList<T extends JsonLdEntity = JsonLdEntity>({
  controller,
  typeMode,
  config,
  onOpenDetail: onOpenDetailProp,
  height = "70vh",
  showHeader = true,
  emptyMessage = "No results. Try another query or filter.",
}: SemanticInfiniteListProps<T>) {
  const defaultOpenDetail = useDefaultOpenDetail(
    "edb-virtualized-components:SemanticInfiniteList",
    typeMode,
  );
  const handleOpenDetail = useCallback(
    (doc: T) => {
      if (onOpenDetailProp) {
        onOpenDetailProp(doc);
      } else {
        defaultOpenDetail(doc);
      }
    },
    [onOpenDetailProp, defaultOpenDetail],
  );

  const { documents, hasNextPage, isFetching, fetchNextPage } = controller;

  const rowProps = {
    typeMode,
    config,
    onOpenDetail: handleOpenDetail,
  } as const;

  return (
    <Box>
      {showHeader ? <InfiniteResultListHeader controller={controller} /> : null}
      {documents.length === 0 ? (
        <Alert severity="info">{emptyMessage}</Alert>
      ) : (
        <Virtuoso
          style={{ height }}
          data={documents}
          endReached={() => {
            if (hasNextPage && !isFetching) {
              fetchNextPage();
            }
          }}
          itemContent={(_index, doc) => (
            <SemanticListRow doc={doc} {...rowProps} />
          )}
          components={{
            Footer: () =>
              controller.isFetchingNextPage ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : null,
          }}
        />
      )}
    </Box>
  );
}
