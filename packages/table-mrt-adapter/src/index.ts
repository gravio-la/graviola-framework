import type { TableColumnDefFragment } from "@graviola/edb-table-types";
import type { MRT_ColumnDef } from "material-react-table";

export const adaptColumnFragmentToMrt = <TRow>(
  fragment: Partial<TableColumnDefFragment<TRow>>,
): Partial<MRT_ColumnDef<TRow>> => {
  return fragment as unknown as Partial<MRT_ColumnDef<TRow>>;
};
