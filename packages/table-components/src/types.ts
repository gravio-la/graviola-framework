import { VisibilityState } from "@tanstack/table-core";

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
