import {
  metaScopeToSparqlColumnId,
  parsePropertyScopeSegments,
} from "@graviola/meta-schema";

import type { TableUiSchema, TableUiSchemaColumn } from "./index";

export type ColumnLike = {
  id?: string;
  header?: unknown;
  enableSorting?: boolean;
  size?: number;
};

export function scopeToJsonLdColumnId(scope: string): string {
  return scope;
}

export function resolveColumnIdForScope(
  scope: string,
  rowShape: "sparql-select" | "jsonld" | string,
): string {
  if (rowShape === "jsonld") {
    return scopeToJsonLdColumnId(scope);
  }
  const metaId = metaScopeToSparqlColumnId(scope);
  if (metaId) return metaId;
  const [rootKey] = parsePropertyScopeSegments(scope);
  if (!rootKey) return scope;
  if (scope.includes("/properties/")) {
    const segments = parsePropertyScopeSegments(scope);
    return `${segments.join("_")}_single`;
  }
  return `${rootKey}_single`;
}

export function buildColumnVisibilityFromTableUiSchema(
  tableUiSchema: TableUiSchema | undefined,
  columns: ColumnLike[],
  rowShape: "sparql-select" | "jsonld" | string,
): Record<string, boolean> {
  if (!tableUiSchema?.columns?.length) return {};

  const visibility: Record<string, boolean> = {};
  const columnIds = new Set(columns.map((col) => col.id).filter(Boolean));

  for (const uiColumn of tableUiSchema.columns) {
    const columnId = resolveColumnIdForScope(uiColumn.scope, rowShape);
    if (!columnIds.has(columnId)) continue;
    if (uiColumn.visibility === "hiddenByDefault") {
      visibility[columnId] = false;
    }
  }

  return visibility;
}

export function filterForbiddenColumns<T extends ColumnLike>(
  columns: T[],
  tableUiSchema: TableUiSchema | undefined,
  rowShape: "sparql-select" | "jsonld" | string,
): T[] {
  if (!tableUiSchema?.columns?.length) return columns;

  const forbiddenIds = new Set(
    tableUiSchema.columns
      .filter((col) => col.visibility === "forbidden")
      .map((col) => resolveColumnIdForScope(col.scope, rowShape)),
  );

  if (forbiddenIds.size === 0) return columns;
  return columns.filter((col) => !col.id || !forbiddenIds.has(col.id));
}

export function applyTableUiSchemaToColumns<T extends ColumnLike>(
  columns: T[],
  tableUiSchema: TableUiSchema | undefined,
  rowShape: "sparql-select" | "jsonld" | string,
): T[] {
  if (!tableUiSchema?.columns?.length) return columns;

  const uiById = new Map<string, TableUiSchemaColumn>();
  for (const uiColumn of tableUiSchema.columns) {
    uiById.set(resolveColumnIdForScope(uiColumn.scope, rowShape), uiColumn);
  }

  return columns.map((column) => {
    if (!column.id) return column;
    const uiColumn = uiById.get(column.id);
    if (!uiColumn) return column;

    return {
      ...column,
      header: uiColumn.label ?? column.header,
      enableSorting:
        uiColumn.sortable === true
          ? true
          : uiColumn.sortable === false
            ? false
            : column.enableSorting,
      size: uiColumn.width ?? column.size,
    };
  });
}

export function resolveDefaultSortingFromTableUiSchema(
  tableUiSchema: TableUiSchema | undefined,
  rowShape: "sparql-select" | "jsonld" | string,
): Array<{ id: string; desc: boolean }> {
  const defaultSort = tableUiSchema?.options?.defaultSort;
  if (!defaultSort?.scope) return [];

  const id = resolveColumnIdForScope(defaultSort.scope, rowShape);
  return [{ id, desc: defaultSort.desc ?? false }];
}
