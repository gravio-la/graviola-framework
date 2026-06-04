import { useCallback } from "react";
import type { DetailViewConfig } from "@graviola/edb-detail-renderer-core";
import type {
  JsonLdEntity,
  ResultListController,
} from "@graviola/edb-state-hooks";
import { Alert, Box, Stack } from "@mui/material";
import { ResultListHeader } from "./ResultListHeader";
import { SemanticListRow } from "./SemanticListRow";
import type { ListTypeMode } from "./listTypes";
import { entityIri, useDefaultOpenDetail } from "./useDefaultOpenDetail";

export type SemanticResultListProps<T extends JsonLdEntity = JsonLdEntity> = {
  controller: ResultListController<T>;
  typeMode: ListTypeMode;
  config?: Partial<DetailViewConfig>;
  onOpenDetail?: (doc: T) => void;
  showHeader?: boolean;
  emptyMessage?: string;
};

export function SemanticResultList<T extends JsonLdEntity = JsonLdEntity>({
  controller,
  typeMode,
  config,
  onOpenDetail: onOpenDetailProp,
  showHeader = true,
  emptyMessage = "No results. Try another query or filter.",
}: SemanticResultListProps<T>) {
  const defaultOpenDetail = useDefaultOpenDetail(
    "edb-virtualized-components:SemanticResultList",
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

  const { documents } = controller;

  return (
    <Box>
      {showHeader ? <ResultListHeader controller={controller} /> : null}
      {documents.length === 0 ? (
        <Alert severity="info">{emptyMessage}</Alert>
      ) : (
        <Stack component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
          {documents.map((doc) => (
            <Box key={entityIri(doc)} component="li">
              <SemanticListRow
                doc={doc}
                typeMode={typeMode}
                config={config}
                onOpenDetail={handleOpenDetail}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
