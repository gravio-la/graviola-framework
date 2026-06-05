import NiceModal from "@ebay/nice-modal-react";
import { GenericModal } from "@graviola/edb-basic-components";
import { filterUndefOrNull } from "@graviola/edb-core-utils";
import {
  MODAL_ENTITY_DETAIL,
  useAdbContext,
  useDataStore,
  useDispatchIntent,
  useGraviolaModal,
  useMutation,
  useQuery,
  useQueryClient,
} from "@graviola/edb-state-hooks";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { hasCapability } from "@graviola/store-core";
import type { MRT_ColumnDef, MRT_SortingState } from "material-react-table";
import { PaginationState } from "@tanstack/table-core";
import type { JSONSchema7 } from "json-schema";
import { useTranslation } from "next-i18next";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { defaultValueRenderers } from "@graviola/edb-detail-renderer";
import {
  composeJsonLdColumns,
  JsonLdTableProvider,
} from "@graviola/edb-table-renderer-jsonld";
import {
  computeColumns,
  type ColumnDefMatcher,
} from "@graviola/edb-table-renderer-sparql-select";

import { SemanticTableView } from "./SemanticTableView";
import type {
  SemanticTableCallbacks,
  SemanticTableProps,
  TableAction,
  TableActionContext,
  TableActionRegistryEntry,
} from "./types";

const defaultLimit = 25;
const upperLimit = 10000;

export const SemanticTable = ({
  typeName,
  csvOptions,
  tableConfigRegistry: tableConfig,
  callbacks: callbacksProp,
  onShowEntry: onShowEntryProp,
  onEditEntry: onEditEntryProp,
  rowShape = "sparql-select",
  actionRegistry,
  tableUiSchema,
  columnRegistry,
  jsonLdCell,
}: SemanticTableProps) => {
  const {
    queryBuildOptions,
    typeNameToTypeIRI,
    typeIRIToTypeName,
    createEntityIRI,
    schema,
    tableActionRegistry,
  } = useAdbContext() as any;

  const dispatchIntent = useDispatchIntent();
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);

  const { t } = useTranslation();
  const { t: t2 } = useTranslation("table");

  const [loadAllAtOnce, setLoadAllAtOnce] = useState(false);

  const handleToggleLoadAll = useCallback(() => {
    setLoadAllAtOnce((v) => !v);
  }, []);

  const typeIRI = useMemo(() => {
    return typeNameToTypeIRI(typeName);
  }, [typeName, typeNameToTypeIRI]);

  const loadedSchema = useMemo(
    () => bringDefinitionToTop(schema as JSONSchema7, typeName),
    [typeName, schema],
  );

  const [sorting, setSorting] = useState<MRT_SortingState>([]);

  const handleSortingChange = useCallback((s: MRT_SortingState) => {
    setSorting(s);
  }, []);

  const { dataStore, ready } = useDataStore();

  const { data: countData, isLoading: countLoading } = useQuery({
    queryKey: ["type", typeIRI, "count"],
    queryFn: async () => {
      const tn = typeIRIToTypeName(typeIRI);
      if (dataStore && hasCapability(dataStore, "counts")) {
        try {
          const amount = await dataStore.count(tn);
          return amount;
        } catch (e) {
          console.error(e);
          return null;
        }
      }
      return null;
    },
  });

  const manualPagination = useMemo(() => {
    return Boolean(countData && countData > defaultLimit && !loadAllAtOnce);
  }, [countData, loadAllAtOnce]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultLimit,
  });

  const handlePaginationChange = useCallback((p: PaginationState) => {
    setPagination(p);
  }, []);

  const { data: resultListData, isLoading } = useQuery({
    queryKey: [
      "type",
      typeIRI,
      "list",
      rowShape,
      sorting,
      loadAllAtOnce ? undefined : pagination,
    ],
    queryFn: async () => {
      const tn = typeIRIToTypeName(typeIRI);

      if (rowShape === "jsonld" && dataStore.filterMany) {
        const documents = await dataStore.filterMany(tn, {
          pagination: loadAllAtOnce ? undefined : pagination,
        } as any);
        return {
          mode: "jsonld",
          documents: documents || [],
        };
      }
      return dataStore.findDocumentsAsFlatResultSet?.(
        tn,
        {
          sorting,
          pagination: loadAllAtOnce ? undefined : pagination,
        },
        loadAllAtOnce ? upperLimit : defaultLimit,
      );
    },
    enabled: ready && !countLoading,
    placeholderData: (previousData) => previousData,
  });

  const resultList = useMemo(() => {
    if ((resultListData as any)?.mode === "jsonld") {
      return (resultListData as any).documents || [];
    }
    return (resultListData as any)?.results?.bindings ?? [];
  }, [resultListData]);

  const conf = useMemo(
    () => tableConfig?.[typeName] || tableConfig?.default,
    [tableConfig, typeName],
  );

  const displayColumns = useMemo<MRT_ColumnDef<any>[]>(() => {
    if (rowShape === "jsonld") {
      return composeJsonLdColumns(loadedSchema, {
        typeName,
        tableUiSchema,
        t: t2,
        columnRegistry,
      });
    }
    return computeColumns(
      loadedSchema,
      typeName,
      t2,
      conf?.matcher as ColumnDefMatcher | undefined,
      [],
      queryBuildOptions.primaryFields,
    );
  }, [
    loadedSchema,
    typeName,
    t2,
    conf?.matcher,
    queryBuildOptions.primaryFields,
    rowShape,
    tableUiSchema,
    columnRegistry,
  ]);

  const columnOrder = useMemo(() => {
    const ids = displayColumns.map((col) => col.id);
    const labelField = queryBuildOptions.primaryFields?.[typeName]?.label as
      | string
      | undefined;
    const primaryColId = labelField ? `${labelField}_single` : undefined;
    const ordered =
      primaryColId && ids.includes(primaryColId)
        ? [primaryColId, ...ids.filter((id) => id !== primaryColId)]
        : ids;
    return ["mrt-row-select", ...ordered];
  }, [displayColumns, queryBuildOptions.primaryFields, typeName]);

  const locale = useSyncExternalStore(
    (cb) => {
      window.addEventListener("popstate", cb);
      return () => window.removeEventListener("popstate", cb);
    },
    () => new URLSearchParams(window.location.search).get("locale") || "en",
    () => "en",
  );

  const editEntry = useCallback(
    (id: string) => {
      if (onEditEntryProp) {
        onEditEntryProp(id, typeIRI);
      } else {
        dispatchIntent({
          kind: "edit-entity",
          typeName,
          entityIRI: id,
          origin: { source: `semantic-table:${typeName}` },
        });
      }
    },
    [dispatchIntent, typeName, typeIRI, onEditEntryProp],
  );

  const showEntry = useCallback(
    (id: string) => {
      if (onShowEntryProp) {
        onShowEntryProp(id, typeIRI);
      } else {
        detailModal.show(
          {
            typeIRI: typeIRI,
            entityIRI: id,
            disableInlineEditing: true,
          },
          {
            origin: { source: `semantic-table:${typeName}` },
          },
        );
      }
    },
    [typeIRI, detailModal, onShowEntryProp, typeName],
  );

  const queryClient = useQueryClient();
  const { mutateAsync: moveToTrashAsync, isPending: aboutToMoveToTrash } =
    useMutation({
      mutationKey: ["moveToTrash", (id: string | string[]) => id],
      mutationFn: async (id: string | string[]) => id,
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ["type", typeIRI] });
      },
    });
  const { mutateAsync: removeEntity, isPending: aboutToRemove } = useMutation({
    mutationKey: ["remove", (id: string) => id],
    mutationFn: async (id: string) => {
      if (!id || !dataStore.remove)
        throw new Error("entityIRI or remove is not defined");
      return dataStore.remove(typeName, id);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["type", typeIRI] });
    },
  });

  const handleRemove = useCallback(
    async (id: string) => {
      NiceModal.show(GenericModal, {
        type: "delete",
      }).then(async () => {
        await removeEntity(id);
      });
    },
    [removeEntity],
  );

  const handleMoveToTrash = useCallback(
    async (id: string) => {
      NiceModal.show(GenericModal, { type: "moveToTrash" }).then(async () => {
        await moveToTrashAsync(id);
      });
    },
    [moveToTrashAsync],
  );

  const handleRemoveSelected = useCallback(
    async (ids: string[]) => {
      const c = ids.length;
      NiceModal.show(GenericModal, {
        type: "delete",
        extraMessage: t("delete selected entries", { count: c }),
      }).then(() => {
        return Promise.all(ids.map((id) => removeEntity(id)));
      });
    },
    [removeEntity, t],
  );

  const handleMoveToTrashSelected = useCallback(
    async (ids: string[]) => {
      const c = ids.length;
      NiceModal.show(GenericModal, {
        type: "moveToTrash",
        extraMessage: t("move selected entries to trash", { count: c }),
      }).then(async () => {
        await moveToTrashAsync(filterUndefOrNull(ids));
      });
    },
    [moveToTrashAsync, t],
  );

  const storeCallbacks = useMemo<SemanticTableCallbacks>(
    () => ({
      onCreateEntry: () => editEntry(createEntityIRI(typeName)),
      onShowEntry: (id, _iri) => showEntry(id),
      onEditEntry: (id, _iri) => editEntry(id),
      onRemoveEntry: (id) => void handleRemove(id),
      onMoveToTrashEntry: (id) => void handleMoveToTrash(id),
      onRemoveSelected: (ids) => void handleRemoveSelected(ids),
      onMoveToTrashSelected: (ids) => void handleMoveToTrashSelected(ids),
      onToggleLoadAll: handleToggleLoadAll,
    }),
    [
      editEntry,
      showEntry,
      createEntityIRI,
      typeName,
      handleRemove,
      handleMoveToTrash,
      handleRemoveSelected,
      handleMoveToTrashSelected,
      handleToggleLoadAll,
    ],
  );

  const mergedCallbacks = useMemo(
    () => ({
      ...storeCallbacks,
      ...callbacksProp,
    }),
    [storeCallbacks, callbacksProp],
  );

  const rowCount =
    !loadAllAtOnce && countData != null ? countData : resultList.length;

  const resolvedActionRegistry = (actionRegistry ||
    tableActionRegistry ||
    []) as TableActionRegistryEntry[];
  const actionContext = useMemo<TableActionContext>(
    () => ({
      typeName,
      rootSchema: loadedSchema,
      rowCount,
      store: dataStore,
      t,
    }),
    [typeName, loadedSchema, rowCount, dataStore, t],
  );
  const rowActions = useMemo<TableAction[]>(() => {
    return resolvedActionRegistry
      .filter((entry) => entry.surface === "row")
      .filter((entry) => entry.tester(loadedSchema as any, actionContext) >= 0)
      .map((entry) => entry.build(actionContext));
  }, [resolvedActionRegistry, loadedSchema, actionContext]);
  const bulkActions = useMemo<TableAction[]>(() => {
    return resolvedActionRegistry
      .filter((entry) => entry.surface === "bulk")
      .filter((entry) => entry.tester(loadedSchema as any, actionContext) >= 0)
      .map((entry) => entry.build(actionContext));
  }, [resolvedActionRegistry, loadedSchema, actionContext]);

  const jsonLdProviderValue = useMemo(
    () => ({
      ChipComponent: jsonLdCell?.ChipComponent,
      valueRenderers: [
        ...(jsonLdCell?.extraValueRenderers ?? []),
        ...defaultValueRenderers,
      ],
      onShowEntry: (entityIRI: string) => showEntry(entityIRI),
      typeIRIToTypeName,
      locale,
    }),
    [
      jsonLdCell?.ChipComponent,
      jsonLdCell?.extraValueRenderers,
      showEntry,
      typeIRIToTypeName,
      locale,
    ],
  );

  const tableView = (
    <SemanticTableView
      typeName={typeName}
      typeIRI={typeIRI}
      columns={displayColumns}
      data={resultList}
      rowCount={rowCount}
      columnOrder={columnOrder}
      isLoading={isLoading}
      isActionPending={aboutToRemove || aboutToMoveToTrash}
      loadAllAtOnce={loadAllAtOnce}
      loadAllUpperLimit={upperLimit}
      pagination={pagination}
      onPaginationChange={handlePaginationChange}
      sorting={sorting}
      onSortingChange={handleSortingChange}
      manualPagination={manualPagination}
      csvOptions={csvOptions}
      tableConfigRegistry={tableConfig}
      callbacks={mergedCallbacks}
      rowActions={rowActions}
      bulkActions={bulkActions}
      locale={locale}
      resetKey={typeName}
    />
  );

  if (rowShape === "jsonld") {
    return (
      <JsonLdTableProvider value={jsonLdProviderValue}>
        {tableView}
      </JsonLdTableProvider>
    );
  }

  return tableView;
};
