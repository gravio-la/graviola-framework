import { useMemo, useState } from "react";
import type {
  TableColumnDefFragment,
  TableColumnRegistry,
  TableUiSchema,
} from "@graviola/edb-table-types";
import type { JSONSchema7 } from "json-schema";
import type { MRT_ColumnDef } from "material-react-table";
import { adaptColumnFragmentToMrt } from "@graviola/edb-table-mrt-adapter";
import type { TableActionContext, TableActionRegistry } from "./types";

export const useResolvedTableColumns = ({
  schema,
}: {
  schema: JSONSchema7;
  typeName: string;
  tableUiSchema?: TableUiSchema;
  registry?: TableColumnRegistry;
  userColumnVisibility?: Record<string, boolean>;
}) => {
  const fragments = useMemo<TableColumnDefFragment[]>(() => {
    return Object.keys(schema?.properties || {}).map((key) => ({
      id: `${key}_single`,
      header: key,
      accessorFn: (row: any) => row?.[key],
    }));
  }, [schema]);

  return {
    fragments,
    initialColumnVisibility: {},
  };
};

export const mergeResolvedColumnsToMrt = (
  fragments: TableColumnDefFragment[],
): MRT_ColumnDef<any>[] => {
  return fragments.map((fragment) => adaptColumnFragmentToMrt(fragment) as any);
};

export const useTableFilterState = (
  _typeName: string,
  _mode: "client" | "server" = "client",
) => {
  const [filterState, setFilterState] = useState<any[]>([]);
  return {
    filterState,
    setFilterState,
    whereClause: undefined,
  };
};

export const useResolvedTableActions = (
  registry: TableActionRegistry,
  ctxBySurface: { row: TableActionContext; bulk: TableActionContext },
) => {
  return useMemo(() => {
    const rowActions = registry
      .filter((entry) => entry.surface === "row")
      .filter(
        (entry) =>
          entry.tester(ctxBySurface.row.rootSchema, ctxBySurface.row) >= 0,
      )
      .map((entry) => entry.build(ctxBySurface.row));
    const bulkActions = registry
      .filter((entry) => entry.surface === "bulk")
      .filter(
        (entry) =>
          entry.tester(ctxBySurface.bulk.rootSchema, ctxBySurface.bulk) >= 0,
      )
      .map((entry) => entry.build(ctxBySurface.bulk));
    return { rowActions, bulkActions };
  }, [registry, ctxBySurface]);
};

export const useTableData = () => {
  return {
    rows: [],
    rowCount: 0,
    isLoading: false,
  };
};
