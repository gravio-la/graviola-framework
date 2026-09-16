import { SemanticTable } from "@graviola/edb-table-components";
import {
  MODAL_ENTITY_DETAIL,
  useAdbContext,
  useDataStore,
  useGraviolaModal,
} from "@graviola/edb-state-hooks";
import { Box, List, ListItem, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { EntityRefView } from "./EntityRefView";
import { resolveEmbedTableProps } from "./resolveEmbedTableProps";
import type { EntityQueryViewProps } from "./types";

/** Markdown embed: read-only listing chrome; row open uses entity detail modal. */
const embedTableCallbacks = {
  onCreateEntry: undefined,
  onRemoveEntry: undefined,
  onMoveToTrashEntry: undefined,
  onRemoveSelected: undefined,
  onMoveToTrashSelected: undefined,
  onToggleLoadAll: undefined,
};

export function EntityQueryView({ spec }: EntityQueryViewProps) {
  const view = spec.view ?? "table";
  const { dataStore, ready } = useDataStore();
  const adb = useAdbContext();
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);
  const limit = spec.limit ?? 20;
  const typeIRI = useMemo(
    () => adb.typeNameToTypeIRI(spec.typeName),
    [adb, spec.typeName],
  );

  const filterManyOptions = useMemo(
    () => ({
      ...(spec.where ? { where: spec.where } : {}),
      limit,
    }),
    [spec.where, limit],
  );

  const tableUi = useMemo(() => resolveEmbedTableProps(spec), [spec]);

  const openEntity = useCallback(
    (entityIRI: string) => {
      detailModal.show({ entityIRI, typeIRI });
    },
    [detailModal, typeIRI],
  );

  const rowsQuery = useQuery({
    queryKey: ["entity-query-embed", spec.typeName, spec.where, limit],
    enabled: ready && view === "list",
    queryFn: async () => {
      if (!dataStore?.filterMany) {
        return [];
      }
      return dataStore.filterMany(spec.typeName, filterManyOptions as never);
    },
  });

  const listItems = useMemo(() => {
    const rows = (rowsQuery.data ?? []) as Record<string, unknown>[];
    return rows.map((row) => {
      const entityIRI = String(row["@id"] ?? "");
      return (
        <ListItem key={entityIRI} disablePadding sx={{ py: 0.25 }}>
          <EntityRefView
            ref={{
              entityId: entityIRI.split("/").pop() ?? entityIRI,
              typeName: spec.typeName,
              view: "chip",
            }}
            defaultView="chip"
          />
        </ListItem>
      );
    });
  }, [rowsQuery.data, spec.typeName]);

  if (view === "table") {
    return (
      <Box sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {spec.typeName} ({limit} max)
        </Typography>
        <SemanticTable
          typeName={spec.typeName}
          rowShape="jsonld"
          layout="embedded"
          toolbarDisplay={tableUi.toolbarDisplay}
          density={tableUi.density}
          width={tableUi.width}
          enableRowSelection={tableUi.enableRowSelection}
          filterManyOptions={filterManyOptions}
          callbacks={embedTableCallbacks}
          onShowEntry={openEntity}
          onEditEntry={openEntity}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {spec.typeName}
      </Typography>
      {rowsQuery.isLoading ? (
        <Typography variant="body2">Loading…</Typography>
      ) : listItems.length > 0 ? (
        <List dense disablePadding>
          {listItems}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No entities found.
        </Typography>
      )}
    </Box>
  );
}
