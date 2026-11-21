import type { MRT_VisibilityState } from "material-react-table";

import type { ListConfigType, TableConfigRegistry } from "./types";

/** Hidden by default; callers can override via `tableConfigRegistry` to show again. */
export const DEFAULT_SEMANTIC_TABLE_COLUMN_VISIBILITY: MRT_VisibilityState = {
  "@id_single": false,
  "@type_single": false,
};

export function resolveInitialColumnVisibility(
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
