import NiceModal from "@ebay/nice-modal-react";
import { GenericModal } from "@graviola/edb-basic-components";
import { encodeIRI, filterUndefOrNull } from "@graviola/edb-core-utils";
import {
  useAdbContext,
  useDataStore,
  useGlobalCRUDOptions,
  useModifiedRouter,
  useMutation,
  useQuery,
  useQueryClient,
} from "@graviola/edb-state-hooks";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { moveToTrash } from "@graviola/sparql-schema";
import type { MRT_ColumnDef, MRT_SortingState } from "material-react-table";
import { PaginationState } from "@tanstack/table-core";
import type { ConfigOptions } from "export-to-csv";
import type { JSONSchema7 } from "json-schema";
import { useTranslation } from "next-i18next";
import { useCallback, useMemo, useState } from "react";

import { computeColumns } from "./listHelper";
import { SemanticTableView } from "./SemanticTableView";
import type { SemanticTableCallbacks, TableConfigRegistry } from "./types";

const defaultLimit = 25;
const upperLimit = 10000;

export type SemanticTableProps = {
  typeName: string;
  csvOptions?: ConfigOptions;
  tableConfigRegistry?: TableConfigRegistry;
  /** Override any individual callback; store-backed defaults are used otherwise */
  callbacks?: Partial<SemanticTableCallbacks>;
  /** Prefer `callbacks.onShowEntry` — kept for backward compatibility */
  onShowEntry?: (id: string, typeIRI: string) => void;
  /** Prefer `callbacks.onEditEntry` — kept for backward compatibility */
  onEditEntry?: (id: string, typeIRI: string) => void;
};

export const SemanticTable = ({
  typeName,
  csvOptions,
  tableConfigRegistry: tableConfig,
  callbacks: callbacksProp,
  onShowEntry: onShowEntryProp,
  onEditEntry: onEditEntryProp,
}: SemanticTableProps) => {
  const {
    queryBuildOptions,
    jsonLDConfig: { defaultPrefix },
    typeNameToTypeIRI,
    typeIRIToTypeName,
    createEntityIRI,
    schema,
    components: { EntityDetailModal },
  } = useAdbContext();

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

  const { crudOptions } = useGlobalCRUDOptions();
  const { dataStore, ready } = useDataStore();

  const { data: countData, isLoading: countLoading } = useQuery({
    queryKey: ["type", typeIRI, "count"],
    queryFn: async () => {
      const tn = typeIRIToTypeName(typeIRI);
      if (dataStore.countDocuments) {
        try {
          const amount = await dataStore.countDocuments(tn);
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
      sorting,
      loadAllAtOnce ? undefined : pagination,
    ],
    queryFn: () => {
      const tn = typeIRIToTypeName(typeIRI);

      return dataStore.findDocumentsAsFlatResultSet(
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

  const resultList = useMemo(
    () => resultListData?.results?.bindings ?? [],
    [resultListData],
  );

  const conf = useMemo(
    () => tableConfig?.[typeName] || tableConfig?.default,
    [tableConfig, typeName],
  );

  const displayColumns = useMemo<MRT_ColumnDef<any>[]>(() => {
    return computeColumns(
      loadedSchema,
      typeName,
      t2,
      conf?.matcher,
      [],
      queryBuildOptions.primaryFields,
    );
  }, [
    loadedSchema,
    typeName,
    t2,
    conf?.matcher,
    queryBuildOptions.primaryFields,
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

  const { push, query } = useModifiedRouter();
  const locale = (query.locale || "en") as string;

  const editEntry = useCallback(
    (id: string) => {
      if (onEditEntryProp) {
        onEditEntryProp(id, typeIRI);
      } else {
        push(`/create/${typeName}?encID=${encodeIRI(id)}`);
      }
    },
    [push, typeName, typeIRI, onEditEntryProp],
  );

  const showEntry = useCallback(
    (id: string) => {
      if (onShowEntryProp) {
        onShowEntryProp(id, typeIRI);
      } else {
        NiceModal.show(EntityDetailModal, {
          typeIRI: typeIRI,
          entityIRI: id,
          disableInlineEditing: true,
        });
      }
    },
    [typeIRI, EntityDetailModal, onShowEntryProp],
  );

  const queryClient = useQueryClient();
  const { mutateAsync: moveToTrashAsync, isPending: aboutToMoveToTrash } =
    useMutation({
      mutationKey: ["moveToTrash", (id: string | string[]) => id],
      mutationFn: async (id: string | string[]) => {
        if (!id || !crudOptions.updateFetch)
          throw new Error("entityIRI or updateFetch is not defined");
        return moveToTrash(id, typeIRI, loadedSchema, crudOptions.updateFetch, {
          defaultPrefix,
          queryBuildOptions,
        });
      },
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ["type", typeIRI] });
      },
    });
  const { mutateAsync: removeEntity, isPending: aboutToRemove } = useMutation({
    mutationKey: ["remove", (id: string) => id],
    mutationFn: async (id: string) => {
      if (!id || !dataStore.removeDocument)
        throw new Error("entityIRI or removeDocument is not defined");
      return dataStore.removeDocument(typeName, id);
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
      NiceModal.show(GenericModal, {
        type: "moveToTrash",
      }).then(async () => {
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

  return (
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
      locale={locale}
      resetKey={typeName}
    />
  );
};
