import { Box, List, Pagination } from "@mui/material";
import { FunctionComponent } from "react";
import { ListItemType } from "./listItemType";
import { SelectableListItem } from "./SelectableListItem";

interface PaginatedTypedListProps {
  data: ListItemType[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelect?: (id: string, selected: boolean) => void;
  onClickEntity?: (id: string) => void;
  selectedIds?: string[];
  /** Applied to every row when {@link rowActionTools} is not set. */
  actionTools?: React.ReactNode;
  /** Per-row secondary actions (e.g. decorative icons). Overrides {@link actionTools} for that row. */
  rowActionTools?: (item: ListItemType) => React.ReactNode;
  readonly?: boolean;
  /** When true, the pagination controls are omitted if there is only one page (saves vertical space). */
  hidePaginationWhenSinglePage?: boolean;
}

export const PaginatedTypedList: FunctionComponent<PaginatedTypedListProps> = ({
  data,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onSelect,
  onClickEntity,
  selectedIds,
  actionTools,
  rowActionTools,
  readonly,
  hidePaginationWhenSinglePage,
}) => {
  const showPagination = !hidePaginationWhenSinglePage || totalPages > 1;

  return (
    <>
      <List sx={{ flexGrow: 1, overflow: "auto" }}>
        {data.map((item, index) => (
          <SelectableListItem
            key={item.entityIRI}
            id={item.entityIRI}
            index={(page - 1) * 10 + index}
            primary={item.label}
            secondary={item.description}
            avatar={item.image}
            selected={selectedIds?.includes(item.entityIRI)}
            onSelect={onSelect}
            onEdit={!readonly ? onEdit : undefined}
            onDelete={!readonly ? onDelete : undefined}
            onClickEntity={onClickEntity}
            actionTools={rowActionTools ? rowActionTools(item) : actionTools}
          />
        ))}
      </List>
      {showPagination && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
          <Pagination
            count={Math.max(totalPages, 1)}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
          />
        </Box>
      )}
    </>
  );
};
