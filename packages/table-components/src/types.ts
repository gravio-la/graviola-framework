import type { PaginationState, VisibilityState } from "@tanstack/table-core";
import type { ConfigOptions } from "export-to-csv";
import type {
  MRT_ColumnDef,
  MRT_SortingState,
  MRT_VisibilityState,
} from "material-react-table";
import type { ReactNode } from "react";
import type { ValueRendererEntry } from "@graviola/edb-detail-renderer-core";
import type {
  TableColumnRegistry,
  TableUiSchema,
} from "@graviola/edb-table-types";
import type { ComponentType } from "react";
import type { JsonLdChipComponentProps } from "@graviola/edb-table-renderer-jsonld";
import type { ColumnDefMatcher } from "@graviola/edb-table-renderer-sparql-select";

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

export type TableAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  run: (
    entities: { entityIRI: string; typeIRI?: string; data?: unknown }[],
  ) => Promise<void> | void;
};

export type TableActionContext = {
  typeName: string;
  rootSchema: any;
  rowCount: number;
  store: unknown;
  t?: (key: string, options?: any) => string;
};

export type TableActionTester = (
  schema: any,
  context: TableActionContext,
) => number;

export type TableActionRegistryEntry = {
  surface: "row" | "bulk";
  name?: string;
  tester: TableActionTester;
  build: (ctx: TableActionContext) => TableAction;
};

export type TableActionRegistry = TableActionRegistryEntry[];

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
  rowActions?: TableAction[];
  bulkActions?: TableAction[];
  /** Optional visibility map from TableUiSchema (hiddenByDefault columns). */
  tableColumnVisibility?: MRT_VisibilityState;
};

export type SemanticTableDataMode = "sparql-select" | "jsonld";

export type SemanticTableJsonLdCellOptions = {
  ChipComponent?: ComponentType<JsonLdChipComponentProps>;
  extraValueRenderers?: ValueRendererEntry[];
};

export type SemanticTableProps = {
  typeName: string;
  csvOptions?: ConfigOptions;
  tableConfigRegistry?: TableConfigRegistry;
  callbacks?: Partial<SemanticTableCallbacks>;
  onShowEntry?: (id: string, typeIRI: string) => void;
  onEditEntry?: (id: string, typeIRI: string) => void;
  rowShape?: SemanticTableDataMode;
  filterMode?: "client" | "server";
  tableUiSchema?: TableUiSchema;
  columnRegistry?: TableColumnRegistry;
  actionRegistry?: TableActionRegistry;
  /** Injection seam for JSON-LD row cells (chips + custom value renderers). */
  jsonLdCell?: SemanticTableJsonLdCellOptions;
};
