import { OverflowContainer } from "@graviola/edb-basic-components";
import { isJSONSchema, resolveSchema } from "@graviola/json-schema-utils";
import {
  isMetaAnnotationScope,
  metaScopeToSparqlColumnId,
  parsePropertyScopeSegments,
  resolveMetaSparqlOrderBy,
} from "@graviola/meta-schema";
import type {
  TableUiSchema,
  TableUiSchemaColumn,
} from "@graviola/edb-table-types";
import {
  applyTableUiSchemaToColumns,
  filterForbiddenColumns,
  resolveColumnIdForScope,
} from "@graviola/edb-table-types";
import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { JSONSchema7 } from "json-schema";
import type { TFunction } from "i18next";
import type { MRT_ColumnDef } from "material-react-table";

import {
  computeColumns,
  type ColumnDefMatcher,
  defaultColumnDefinitionStub,
} from "./listHelper";
import { mkAccessor } from "./tableRegistryHelper";

export type ComposeSparqlSelectColumnsOptions = {
  typeName: string;
  tableUiSchema?: TableUiSchema;
  t: TFunction;
  matcher?: ColumnDefMatcher;
  primaryFields?: PrimaryFieldDeclaration;
};

function resolvePropertySchemaAtScope(
  rootSchema: JSONSchema7,
  scope: string,
): JSONSchema7 | null {
  const keys = parsePropertyScopeSegments(scope);
  if (!keys.length) return null;

  let current: JSONSchema7 = rootSchema;
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const raw = current.properties?.[key];
    if (!raw || !isJSONSchema(raw)) return null;

    let propSchema = raw as JSONSchema7;
    if (propSchema.$ref) {
      const resolved = resolveSchema(rootSchema, propSchema.$ref, rootSchema);
      if (
        !resolved ||
        typeof resolved !== "object" ||
        Array.isArray(resolved)
      ) {
        return null;
      }
      propSchema = resolved as JSONSchema7;
    }

    if (index === keys.length - 1) {
      return propSchema;
    }

    if (propSchema.type !== "object" && !propSchema.properties) {
      return null;
    }
    current = propSchema;
  }

  return null;
}

function buildMetaAnnotationColumn(
  rootSchema: JSONSchema7,
  uiColumn: TableUiSchemaColumn,
  typeName: string,
  t: TFunction,
): MRT_ColumnDef<any> | null {
  if (!isMetaAnnotationScope(uiColumn.scope)) return null;

  const propSchema = resolvePropertySchemaAtScope(rootSchema, uiColumn.scope);
  if (!propSchema) return null;

  const columnId =
    uiColumn.sparqlOrderBy ??
    metaScopeToSparqlColumnId(uiColumn.scope) ??
    resolveColumnIdForScope(uiColumn.scope, "sparql-select");

  const keys = parsePropertyScopeSegments(uiColumn.scope);
  const leafKey = keys[keys.length - 1];
  const path = parsePropertyScopeSegments(uiColumn.scope).map(
    (segment, index) =>
      index === 0 && segment === "$meta" ? "entityMeta" : segment,
  );

  const stub =
    defaultColumnDefinitionStub(
      typeName,
      leafKey,
      propSchema,
      rootSchema,
      t,
      path.slice(0, -1),
    ) ?? null;

  return {
    id: columnId,
    header: uiColumn.label ?? leafKey,
    accessorFn: mkAccessor(`${columnId}.value`, ""),
    enableSorting: uiColumn.sortable === true,
    Cell:
      stub?.Cell ??
      (({ cell, table }) => (
        <OverflowContainer density={table.getState().density}>
          {String(cell.getValue() ?? "")}
        </OverflowContainer>
      )),
  };
}

function excludeMetaContainerColumns(
  columns: MRT_ColumnDef<any>[],
  tableUiSchema: TableUiSchema | undefined,
): MRT_ColumnDef<any>[] {
  const leafColumnIds = new Set(
    (tableUiSchema?.columns ?? [])
      .filter(
        (col) =>
          isMetaAnnotationScope(col.scope) &&
          parsePropertyScopeSegments(col.scope).length > 1,
      )
      .map((col) => resolveColumnIdForScope(col.scope, "sparql-select")),
  );
  if (leafColumnIds.size === 0) return columns;

  return columns.filter((col) => {
    if (!col.id) return true;
    if (leafColumnIds.has(col.id)) return true;
    if (col.id.startsWith("$meta_") || col.id.startsWith("entityMeta_")) {
      return false;
    }
    return true;
  });
}

function mergeAnnotationColumns(
  baseColumns: MRT_ColumnDef<any>[],
  rootSchema: JSONSchema7,
  tableUiSchema: TableUiSchema | undefined,
  typeName: string,
  t: TFunction,
): MRT_ColumnDef<any>[] {
  if (!tableUiSchema?.columns?.length) return baseColumns;

  const nestedUiColumns = tableUiSchema.columns.filter((col) =>
    isMetaAnnotationScope(col.scope),
  );
  if (!nestedUiColumns.length) return baseColumns;

  const existingIds = new Set(baseColumns.map((col) => col.id).filter(Boolean));
  const merged = [...baseColumns];

  for (const uiColumn of nestedUiColumns) {
    const columnId = resolveColumnIdForScope(uiColumn.scope, "sparql-select");
    if (existingIds.has(columnId)) continue;

    const column = buildMetaAnnotationColumn(rootSchema, uiColumn, typeName, t);
    if (!column) continue;

    merged.push(column);
    existingIds.add(columnId);
  }

  return merged;
}

export function composeSparqlSelectColumns(
  schema: JSONSchema7,
  options: ComposeSparqlSelectColumnsOptions,
): MRT_ColumnDef<any>[] {
  const baseColumns = computeColumns(
    schema,
    options.typeName,
    options.t,
    options.matcher,
    [],
    options.primaryFields,
  );

  const withAnnotations = mergeAnnotationColumns(
    baseColumns,
    schema,
    options.tableUiSchema,
    options.typeName,
    options.t,
  );

  const filtered = filterForbiddenColumns(
    withAnnotations,
    options.tableUiSchema,
    "sparql-select",
  );

  const withoutMetaContainer = excludeMetaContainerColumns(
    filtered,
    options.tableUiSchema,
  );

  return applyTableUiSchemaToColumns(
    withoutMetaContainer,
    options.tableUiSchema,
    "sparql-select",
  );
}

export function resolveSparqlSortColumnId(
  sortingId: string,
  tableUiSchema?: TableUiSchema,
): string {
  const uiColumn = tableUiSchema?.columns?.find((col) => {
    const id = resolveColumnIdForScope(col.scope, "sparql-select");
    return id === sortingId;
  });

  if (!uiColumn) return sortingId;
  return (
    resolveMetaSparqlOrderBy(uiColumn.scope, uiColumn.sparqlOrderBy) ??
    sortingId
  );
}
