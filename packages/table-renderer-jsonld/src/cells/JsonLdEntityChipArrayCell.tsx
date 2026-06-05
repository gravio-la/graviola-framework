import React from "react";
import { Stack } from "@mui/material";
import { OverflowContainer } from "@graviola/edb-basic-components";
import type {
  MRT_Cell,
  MRT_Row,
  MRT_TableInstance,
} from "material-react-table";

import { useJsonLdTableContext } from "../JsonLdTableContext";

type CellProps = {
  cell: MRT_Cell<Record<string, unknown>>;
  row: MRT_Row<Record<string, unknown>>;
  table: MRT_TableInstance<Record<string, unknown>>;
};

function asEntityArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

export function JsonLdEntityChipArrayCell({ cell, table }: CellProps) {
  const { ChipComponent, onShowEntry, typeIRIToTypeName } =
    useJsonLdTableContext();
  const items = asEntityArray(cell.getValue());
  if (items.length === 0) return null;

  const density = table.getState().density;

  return (
    <OverflowContainer density={density}>
      <Stack
        direction="row"
        flexWrap={density === "spacious" ? "wrap" : "nowrap"}
        gap={0.5}
        alignItems="center"
      >
        {items.map((data, index) => {
          const typeIRI =
            typeof data["@type"] === "string"
              ? (data["@type"] as string)
              : undefined;
          const entityIRI =
            typeof data["@id"] === "string"
              ? (data["@id"] as string)
              : `anon-${index}`;
          const typeName =
            typeIRI && typeIRIToTypeName
              ? typeIRIToTypeName(typeIRI)
              : undefined;
          const handleClick =
            typeof data["@id"] === "string" && onShowEntry
              ? () => onShowEntry(data["@id"] as string, typeIRI)
              : undefined;

          return (
            <ChipComponent
              key={entityIRI}
              data={data}
              entityIRI={
                typeof data["@id"] === "string" ? entityIRI : undefined
              }
              typeIRI={typeIRI}
              typeName={typeName}
              onClick={handleClick}
            />
          );
        })}
      </Stack>
    </OverflowContainer>
  );
}
