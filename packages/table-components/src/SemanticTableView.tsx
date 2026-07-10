import {
  CloudDone,
  CloudSync,
  Delete,
  DeleteForever,
  Edit,
  FileDownload,
  NoteAdd,
  OpenInNew,
} from "@mui/icons-material";
import {
  Backdrop,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  ListItemIcon,
  MenuItem,
  Skeleton,
  Tooltip,
} from "@mui/material";
import Button from "@mui/material/Button";
import { ConfigOptions, download, generateCsv, mkConfig } from "export-to-csv";
import {
  MaterialReactTable,
  MRT_ColumnFiltersState,
  MRT_Row,
  MRT_RowSelectionState,
  MRT_TableInstance,
  MRT_Virtualizer,
  MRT_VisibilityState,
  useMaterialReactTable,
} from "material-react-table";
import { MRT_Localization_DE } from "material-react-table/locales/de";
import { MRT_Localization_EN } from "material-react-table/locales/en";
import { useTranslation } from "next-i18next";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";

import { ExportMenuButton } from "./ExportMenuButton";
import type {
  ListConfigType,
  SemanticTableViewProps,
  TableConfigRegistry,
} from "./types";

const defaultLimit = 25;
const defaultLoadAllUpperLimit = 10000;

const defaultCsvOptions: ConfigOptions = {
  fieldSeparator: ",",
  decimalSeparator: ".",
  useKeysAsHeaders: true,
};

/** Hidden by default; callers can override via `tableConfigRegistry` to show again. */
const DEFAULT_SEMANTIC_TABLE_COLUMN_VISIBILITY: MRT_VisibilityState = {
  "@id_single": false,
  "@type_single": false,
};

function resolveInitialColumnVisibility(
  conf: Partial<ListConfigType> | undefined,
  tableConfig: TableConfigRegistry | undefined,
  tableColumnVisibility?: MRT_VisibilityState,
): MRT_VisibilityState {
  return {
    ...DEFAULT_SEMANTIC_TABLE_COLUMN_VISIBILITY,
    ...tableConfig?.default?.columnVisibility,
    ...conf?.columnVisibility,
    ...tableColumnVisibility,
  };
}

function extractEntityId(rowOriginal: any): string | undefined {
  return (
    rowOriginal?.entity?.value ??
    rowOriginal?.originalValue?.entity?.value ??
    rowOriginal?.["@id"]
  );
}

export function SemanticTableView({
  typeName,
  typeIRI = "",
  columns,
  data,
  rowCount,
  columnOrder,
  isLoading = false,
  isActionPending = false,
  loadAllAtOnce = false,
  loadAllUpperLimit = defaultLoadAllUpperLimit,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  manualPagination,
  manualSorting = true,
  csvOptions,
  tableConfigRegistry: tableConfig,
  callbacks = {},
  rowActions = [],
  bulkActions = [],
  locale = "en",
  resetKey,
  tableColumnVisibility,
  columnVisibility: columnVisibilityProp,
  onColumnVisibilityChange: onColumnVisibilityChangeProp,
}: SemanticTableViewProps) {
  const {
    onShowEntry,
    onEditEntry,
    onRemoveEntry,
    onMoveToTrashEntry,
    onCreateEntry,
    onRemoveSelected,
    onMoveToTrashSelected,
    onToggleLoadAll,
  } = callbacks;

  const csvConfig = useMemo(
    () => mkConfig(csvOptions || defaultCsvOptions),
    [csvOptions],
  );

  const { t } = useTranslation();

  const conf = useMemo(
    () => tableConfig?.[typeName] || tableConfig?.default,
    [tableConfig, typeName],
  );

  const localization = useMemo(
    () => (locale === "de" ? MRT_Localization_DE : MRT_Localization_EN),
    [locale],
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
  const exitFullscreen = useCallback(() => setIsFullscreen(false), []);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizerInstanceRef =
    useRef<MRT_Virtualizer<HTMLDivElement, HTMLTableRowElement>>(null);

  const handleExportRows = (rows: MRT_Row<any>[]) => {
    const rowData = rows.map((row) =>
      Object.fromEntries(
        row.getAllCells().map((cell) => [cell.column.id, cell.getValue()]),
      ),
    );
    const csv = generateCsv(csvConfig)(rowData as any);
    download(csvConfig)(csv);
  };

  const handleExportData = useCallback(() => {
    const csv = generateCsv(csvConfig)(
      data.map((entity) =>
        Object.fromEntries(
          Object.entries(entity).map(([k, v]) => [
            k,
            String((v as any)?.value ?? v ?? ""),
          ]),
        ),
      ),
    );
    download(csvConfig)(csv);
  }, [data, csvConfig]);

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const handleRowSelectionChange = useCallback(
    (s: MRT_RowSelectionState) => {
      setRowSelection(s);
    },
    [setRowSelection],
  );

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );
  const handleColumnFilterChange = useCallback(
    (
      s:
        | MRT_ColumnFiltersState
        | ((old: MRT_ColumnFiltersState) => MRT_ColumnFiltersState),
    ) => {
      setColumnFilters((old) => (typeof s === "function" ? s(old) : s));
    },
    [setColumnFilters],
  );

  const isControlledVisibility =
    columnVisibilityProp !== undefined &&
    onColumnVisibilityChangeProp !== undefined;

  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<MRT_VisibilityState>(() =>
      resolveInitialColumnVisibility(conf, tableConfig, tableColumnVisibility),
    );

  const columnVisibility = isControlledVisibility
    ? columnVisibilityProp
    : internalColumnVisibility;

  const handleChangeColumnVisibility = useCallback(
    (
      updater:
        | MRT_VisibilityState
        | ((old: MRT_VisibilityState) => MRT_VisibilityState),
    ) => {
      const apply = (old: MRT_VisibilityState, next: MRT_VisibilityState) => {
        const keys = new Set([...Object.keys(old), ...Object.keys(next)]);
        for (const key of keys) {
          if (old[key] !== next[key]) return next;
        }
        return old;
      };

      if (isControlledVisibility) {
        onColumnVisibilityChangeProp!((old) =>
          apply(old, typeof updater === "function" ? updater(old) : updater),
        );
      } else {
        setInternalColumnVisibility((old) =>
          apply(old, typeof updater === "function" ? updater(old) : updater),
        );
      }
    },
    [isControlledVisibility, onColumnVisibilityChangeProp],
  );

  const handleBulkRemove = useCallback(
    (table_: MRT_TableInstance<any>) => {
      if (!onRemoveSelected) return;
      const ids = filterIdsFromTable(table_);
      void onRemoveSelected(ids);
    },
    [onRemoveSelected],
  );

  const handleBulkMoveToTrash = useCallback(
    (table_: MRT_TableInstance<any>) => {
      if (!onMoveToTrashSelected) return;
      const ids = filterIdsFromTable(table_);
      void onMoveToTrashSelected(ids);
    },
    [onMoveToTrashSelected],
  );

  const hasRowActions = Boolean(
    onShowEntry ||
    onEditEntry ||
    onRemoveEntry ||
    onMoveToTrashEntry ||
    rowActions.length > 0,
  );
  const hasBulkActions = Boolean(
    onRemoveSelected || onMoveToTrashSelected || bulkActions.length > 0,
  );

  const table = useMaterialReactTable({
    columns,
    data,
    enableStickyHeader: true,
    rowVirtualizerInstanceRef,
    muiTableContainerProps: {
      ref: tableContainerRef,
      sx: {
        flex: 1,
        overflow: "auto",
        minHeight: 0,
        "&::-webkit-scrollbar": {
          height: 8,
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#F8F8F8",
          borderRadius: 4,
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#B6BCC3",
          borderRadius: 4,
        },
      },
    },
    rowVirtualizerOptions: { overscan: 4 },
    enableColumnVirtualization: false,
    enableColumnOrdering: true,
    enableRowSelection: true,
    enableFacetedValues: true,
    enableBottomToolbar: true,
    enableTopToolbar: true,
    enableFullScreenToggle: true,
    enableColumnActions: true,
    enableDensityToggle: true,
    enableHiding: true,
    positionToolbarAlertBanner: "none",
    layoutMode: "semantic",
    muiTablePaperProps: {
      sx: {
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      },
    },
    onRowSelectionChange: handleRowSelectionChange,
    manualPagination,
    manualSorting,
    onPaginationChange: onPaginationChange,
    onSortingChange: onSortingChange,
    onColumnVisibilityChange: handleChangeColumnVisibility,
    onIsFullScreenChange: (full: boolean) => {
      setIsFullscreen(full);
    },
    columnFilterDisplayMode: "popover",
    initialState: {
      ...(isControlledVisibility
        ? {}
        : {
            columnVisibility: resolveInitialColumnVisibility(
              conf,
              tableConfig,
              tableColumnVisibility,
            ),
          }),
      pagination: { pageIndex: 0, pageSize: defaultLimit },
    },
    localization,
    rowCount,
    enableRowActions: hasRowActions,
    renderTopToolbarCustomActions: ({ table }) => {
      const selectedRows = table.getSelectedRowModel().rows;
      const selectedCount = selectedRows.length;
      const hasSelection = selectedCount > 0;

      return (
        <Box
          sx={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {onCreateEntry ? (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<NoteAdd />}
              onClick={() => onCreateEntry()}
            >
              {t("create new", { item: t(typeName) })}
            </Button>
          ) : null}

          {hasSelection && hasBulkActions ? (
            <>
              <Chip
                label={t("selected entries", { count: selectedCount })}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: "bold" }}
              />

              {onMoveToTrashSelected ? (
                <Tooltip title={t("move to trash")}>
                  <IconButton
                    onClick={() => handleBulkMoveToTrash(table)}
                    color="warning"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              ) : null}

              {onRemoveSelected ? (
                <Tooltip title={t("delete permanently")}>
                  <IconButton
                    onClick={() => handleBulkRemove(table)}
                    color="error"
                    size="small"
                  >
                    <DeleteForever />
                  </IconButton>
                </Tooltip>
              ) : null}
              {bulkActions.map((action) => (
                <Tooltip key={action.id} title={action.label}>
                  <IconButton
                    onClick={() =>
                      void action.run(
                        selectedRows.map((r) => ({
                          entityIRI: r.id,
                          typeIRI,
                          data: r.original,
                        })),
                      )
                    }
                    color={action.destructive ? "error" : "default"}
                    size="small"
                  >
                    {action.icon || <OpenInNew />}
                  </IconButton>
                </Tooltip>
              ))}
            </>
          ) : null}

          <ExportMenuButton>
            <MenuItem onClick={handleExportData}>
              <ListItemIcon>
                <FileDownload />
              </ListItemIcon>
              {t("export all data")}
            </MenuItem>
            <MenuItem
              disabled={table.getRowModel().rows.length === 0}
              onClick={() => handleExportRows(table.getRowModel().rows)}
            >
              <ListItemIcon>
                <FileDownload />
              </ListItemIcon>
              {t("export page only")}
            </MenuItem>
            <MenuItem
              disabled={!hasSelection}
              onClick={() => handleExportRows(selectedRows)}
            >
              <ListItemIcon>
                <FileDownload />
              </ListItemIcon>
              {t("export selected rows only")}
            </MenuItem>
          </ExportMenuButton>

          {onToggleLoadAll ? (
            <Tooltip
              title={
                t("load all data into client") +
                ` (max ${loadAllUpperLimit} entries)`
              }
            >
              <IconButton
                onClick={() => onToggleLoadAll()}
                color={loadAllAtOnce ? "success" : "default"}
                aria-label={t("load all data into client")}
              >
                {loadAllAtOnce ? <CloudDone /> : <CloudSync />}
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      );
    },
    getRowId: (row) =>
      (row as any)?.entity?.value ||
      (row as any)?.originalValue?.entity?.value ||
      (row as any)?.["@id"] ||
      `urn:${uuidv4()}`,
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "",
      },
    },
    renderRowActionMenuItems: hasRowActions
      ? ({ row }) => {
          const items: ReactNode[] = [];
          if (onShowEntry) {
            items.push(
              <MenuItem
                key="show"
                onClick={() => onShowEntry(row.id, typeIRI)}
                sx={{ minWidth: 200 }}
              >
                <ListItemIcon>
                  <OpenInNew />
                </ListItemIcon>
                {t("show")}
              </MenuItem>,
            );
          }
          if (onEditEntry) {
            items.push(
              <MenuItem
                key="edit"
                onClick={() => onEditEntry(row.id, typeIRI)}
                sx={{ minWidth: 200 }}
              >
                <ListItemIcon>
                  <Edit />
                </ListItemIcon>
                {t("edit")}
              </MenuItem>,
            );
          }
          if (onMoveToTrashEntry) {
            items.push(
              <MenuItem
                key="moveToTrash"
                onClick={() => void onMoveToTrashEntry(row.id)}
                sx={{ minWidth: 200 }}
              >
                <ListItemIcon>
                  <Delete />
                </ListItemIcon>
                {t("move to trash")}
              </MenuItem>,
            );
          }
          if (onRemoveEntry) {
            items.push(
              <MenuItem
                key="deleteForever"
                onClick={() => void onRemoveEntry(row.id)}
                sx={{ minWidth: 200 }}
              >
                <ListItemIcon>
                  <DeleteForever />
                </ListItemIcon>
                {t("delete permanently")}
              </MenuItem>,
            );
          }
          if (rowActions.length > 0) {
            rowActions.forEach((action) => {
              items.push(
                <MenuItem
                  key={action.id}
                  onClick={() =>
                    void action.run([
                      {
                        entityIRI: row.id,
                        typeIRI,
                        data: row.original,
                      },
                    ])
                  }
                  sx={{ minWidth: 200 }}
                >
                  <ListItemIcon>{action.icon || <OpenInNew />}</ListItemIcon>
                  {action.label}
                </MenuItem>,
              );
            });
          }
          return items;
        }
      : undefined,
    enableColumnResizing: true,
    enableColumnDragging: false,
    onColumnFiltersChange: handleColumnFilterChange,
    state: {
      pagination,
      columnOrder,
      sorting,
      rowSelection,
      columnFilters,
      columnVisibility,
      isFullScreen: isFullscreen,
    },
  });

  useEffect(() => {
    (table as any).onShowEntry = onShowEntry;
  }, [table, onShowEntry]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        exitFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [isFullscreen, exitFullscreen]);

  const prevResetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (resetKey !== undefined && prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey;
      table.reset();
    }
  }, [resetKey, table]);

  return (
    <Box
      sx={{
        flex: 1,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: "absolute",
        }}
        open={isLoading || isActionPending}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {isLoading && columns.length <= 0 ? (
        <Skeleton
          variant="rectangular"
          sx={{ position: "absolute", inset: 0 }}
        />
      ) : (
        <MaterialReactTable table={table} />
      )}
    </Box>
  );
}

function filterIdsFromTable(table_: MRT_TableInstance<any>): string[] {
  const selectedRows = table_.getSelectedRowModel().rows;
  return selectedRows
    .map((row) => extractEntityId(row.original))
    .filter((id): id is string => Boolean(id));
}
