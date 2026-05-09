import { useAdbContext, useDataStore } from "@graviola/edb-state-hooks";
import { Box, Button, BoxProps, useControlled } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FunctionComponent, useCallback, useState } from "react";
import { PaginatedTypedList } from "./PaginatedTypedList";
import { Add, Refresh } from "@mui/icons-material";
import NiceModal from "@ebay/nice-modal-react";
import { GenericModal } from "@graviola/edb-basic-components";
import {
  FlatResult,
  extractPrimaryFieldsFromFlatResult,
} from "@graviola/edb-core-utils";
import { hasCapability } from "@graviola/store-core";
import { ListItemType } from "./listItemType";

export type GenericPaginatedListProps = {
  typeName: string;
  pageSize?: number;
  readonly?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  onEdit?: (id: string) => void;
  onClickEntity?: (id: string) => void;
  onCreateNew?: () => void;
  onDelete?: ((id: string) => void) | null;
} & BoxProps;

export const GenericPaginatedList: FunctionComponent<
  GenericPaginatedListProps
> = ({
  typeName,
  pageSize = 10,
  readonly,
  selectable,
  selectedIds: selectedIdsProp,
  defaultSelectedIds,
  onSelectedIdsChange,
  onEdit,
  onClickEntity,
  onCreateNew,
  onDelete,
  ...props
}) => {
  const [page, setPage] = useState(1);
  const { dataStore } = useDataStore();
  const {
    typeNameToTypeIRI,
    queryBuildOptions: { primaryFields },
  } = useAdbContext();
  const typeIRI = typeNameToTypeIRI(typeName);
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useControlled({
    controlled: selectedIdsProp,
    default: defaultSelectedIds || [],
    name: "GenericPaginatedList",
    state: "selectedIds",
  });

  const handleSelect = useCallback(
    (id: string, selected: boolean) => {
      const newSelectedIds = selected
        ? [...selectedIds, id]
        : selectedIds.filter((selectedId) => selectedId !== id);

      setSelectedIds(newSelectedIds);
      if (onSelectedIdsChange) {
        onSelectedIdsChange(newSelectedIds);
      }
    },
    [selectedIds, setSelectedIds, onSelectedIdsChange],
  );

  const { data: countData } = useQuery({
    queryKey: ["type", typeIRI, "count"],
    queryFn: async () => {
      if (dataStore && hasCapability(dataStore, "counts")) {
        try {
          return await dataStore.count(typeName, {});
        } catch (e) {
          console.error(e);
          return 0;
        }
      }
      return 0;
    },
  });

  const { data: results, refetch } = useQuery<ListItemType[]>({
    queryKey: ["type", typeIRI, "list", page],
    queryFn: async () => {
      const primaryFieldDeclaration = primaryFields[typeName] || {};

      const result =
        (
          await dataStore.findDocumentsAsFlatResultSet(
            typeName,
            {
              pagination: {
                pageIndex: page - 1,
                pageSize,
              },
            },
            pageSize,
          )
        ).results?.bindings || ([] as FlatResult[]);
      return result.map((result) => {
        const listItem = extractPrimaryFieldsFromFlatResult(
          result,
          primaryFieldDeclaration,
        ) as ListItemType;
        if (!listItem.label || listItem.label === "") {
          listItem.label = listItem.entityIRI;
        }
        return listItem;
      });
    },
  });

  const removeMutation = useMutation({
    mutationKey: ["remove", typeIRI],
    mutationFn: async (entityIRI: string) => {
      if (!dataStore.remove) {
        throw new Error("remove not available");
      }
      return await dataStore.remove(typeName, entityIRI);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["type", typeIRI] });
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      if (onDelete === null) {
        return;
      }

      if (onDelete) {
        onDelete(id);
        return;
      }

      NiceModal.show(GenericModal, {
        type: "delete",
      }).then(async () => {
        await removeMutation.mutateAsync(id);
      });
    },
    [removeMutation, onDelete],
  );

  const totalPages = Math.ceil((countData || 0) / pageSize);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "100%",
      }}
      {...props}
    >
      <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
        {!readonly && onCreateNew && (
          <Button variant="contained" startIcon={<Add />} onClick={onCreateNew}>
            Create New
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => refetch()}
        >
          Reload
        </Button>
      </Box>
      <PaginatedTypedList
        data={results || []}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={!readonly && onEdit ? onEdit : undefined}
        onDelete={!readonly && onDelete !== null ? handleDelete : undefined}
        onClickEntity={onClickEntity}
        readonly={readonly}
        selectedIds={selectedIds}
        onSelect={selectable ? handleSelect : undefined}
      />
    </Box>
  );
};
