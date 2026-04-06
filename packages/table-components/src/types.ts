import type { PaginationState, VisibilityState } from "@tanstack/table-core";
import type { ConfigOptions } from "export-to-csv";
import type { MRT_ColumnDef, MRT_SortingState } from "material-react-table";

import { ColumnDefMatcher } from "./listHelper";

export type ListConfigType = {
  columnVisibility: VisibilityState;
  matcher: ColumnDefMatcher;
};

/**
 * Optional UI config for `SemanticTable`.
 * Omit the whole registry for schema-driven columns and default (all visible) visibility.
 * `default` applies to any `typeName` not listed explicitly.
 */
export type TableConfigRegistry = {
  default?: Partial<ListConfigType>;
  [typeName: string]: Partial<ListConfigType> | undefined;
};

/**
 * All row/bulk/toolbar actions. Every field is optional — omitting one hides the corresponding UI element.
 */
export type SemanticTableCallbacks = {
  /** Row context menu */
  onShowEntry?: (id: string, typeIRI: string) => void;
  onEditEntry?: (id: string, typeIRI: string) => void;
  onRemoveEntry?: (id: string) => Promise<void> | void;
  onMoveToTrashEntry?: (id: string) => Promise<void> | void;

  /** Top toolbar */
  onCreateEntry?: () => void;

  /** Bulk selection toolbar */
  onRemoveSelected?: (ids: string[]) => Promise<void> | void;
  onMoveToTrashSelected?: (ids: string[]) => Promise<void> | void;

  /** Load-all toggle */
  onToggleLoadAll?: () => void;
};

export type SemanticTableViewProps = {
  typeName: string;
  /** Used in row callbacks; defaults to empty string if omitted (callers should pass when using callbacks). */
  typeIRI?: string;
  columns: MRT_ColumnDef<any>[];
  data: any[];
  /** Total row count for server-side pagination */
  rowCount: number;
  columnOrder: string[];
  isLoading?: boolean;
  isActionPending?: boolean;
  loadAllAtOnce?: boolean;
  /** Max entries for load-all tooltip (default 10000) */
  loadAllUpperLimit?: number;

  pagination: PaginationState;
  onPaginationChange: (p: PaginationState) => void;
  sorting: MRT_SortingState;
  onSortingChange: (s: MRT_SortingState) => void;
  manualPagination: boolean;

  csvOptions?: ConfigOptions;
  tableConfigRegistry?: TableConfigRegistry;
  callbacks?: SemanticTableCallbacks;
  /** i18n locale for MRT strings */
  locale?: string;
  /**
   * When this value changes, the table internal state is reset (e.g. pass `typeName`).
   */
  resetKey?: string;
};
