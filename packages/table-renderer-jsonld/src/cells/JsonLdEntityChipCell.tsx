import React from "react";
import type {
  MRT_Cell,
  MRT_Row,
  MRT_TableInstance,
} from "material-react-table";

import { useJsonLdTableContext } from "../JsonLdTableContext";
import { readJsonLdCellMeta } from "./types";

type CellProps = {
  cell: MRT_Cell<Record<string, unknown>>;
  row: MRT_Row<Record<string, unknown>>;
  table: MRT_TableInstance<Record<string, unknown>>;
};

function asEntityRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function JsonLdEntityChipCell({ cell }: CellProps) {
  const { ChipComponent, onShowEntry, typeIRIToTypeName } =
    useJsonLdTableContext();
  const data = asEntityRecord(cell.getValue());
  if (!data) return null;

  const typeIRI =
    typeof data["@type"] === "string" ? (data["@type"] as string) : undefined;
  const entityIRI =
    typeof data["@id"] === "string" ? (data["@id"] as string) : undefined;
  const typeName =
    typeIRI && typeIRIToTypeName ? typeIRIToTypeName(typeIRI) : undefined;

  const handleClick =
    entityIRI && onShowEntry
      ? () => onShowEntry(entityIRI, typeIRI)
      : undefined;

  return (
    <ChipComponent
      data={data}
      entityIRI={entityIRI}
      typeIRI={typeIRI}
      typeName={typeName}
      onClick={handleClick}
    />
  );
}
