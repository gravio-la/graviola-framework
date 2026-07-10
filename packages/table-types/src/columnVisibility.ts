import {
  isMetaAnnotationScope,
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

/**
 * JSON-LD lists load full documents via CONSTRUCT — meta fields are already in memory.
 * Show lifecycle annotation columns by default (SPARQL flat SELECT keeps them opt-in).
 */
export function normalizeTableUiSchemaForRowShape(
  tableUiSchema: TableUiSchema | undefined,
  rowShape: "sparql-select" | "jsonld" | string,
): TableUiSchema | undefined {
  if (rowShape !== "jsonld" || !tableUiSchema?.columns?.length) {
    return tableUiSchema;
  }

  return {
    ...tableUiSchema,
    columns: tableUiSchema.columns.map((column) => {
      if (
        column.visibility !== "hiddenByDefault" ||
        !isMetaAnnotationScope(column.scope) ||
        parsePropertyScopeSegments(column.scope).length < 2
      ) {
        return column;
      }
      return { ...column, visibility: "visible" as const };
    }),
  };
}

/** Demand-driven meta annotation scopes for SPARQL flat SELECT projection. */
export function resolveActiveMetaAnnotationScopes(
  tableUiSchema: TableUiSchema | undefined,
  visibleColumnIds: Set<string>,
  sortingColumnIds: string[],
  rowShape: "sparql-select" | "jsonld" | string,
): string[] {
  if (rowShape !== "sparql-select" || !tableUiSchema?.columns?.length) {
    return [];
  }

  const defaultSortScope = tableUiSchema.options?.defaultSort?.scope;
  const sortingIds = new Set(sortingColumnIds);
  const scopes: string[] = [];
  const seen = new Set<string>();

  for (const uiColumn of tableUiSchema.columns) {
    if (uiColumn.visibility === "forbidden") continue;
    const scope = uiColumn.scope;
    if (!isMetaAnnotationScope(scope)) continue;
    if (parsePropertyScopeSegments(scope).length < 2) continue;

    const columnId = resolveColumnIdForScope(scope, rowShape);
    const visible = visibleColumnIds.has(columnId);
    const sorted = sortingIds.has(columnId);
    const defaultSorted = scope === defaultSortScope;

    if (!visible && !sorted && !defaultSorted) continue;
    if (seen.has(scope)) continue;
    seen.add(scope);
    scopes.push(scope);
  }

  return scopes;
}
