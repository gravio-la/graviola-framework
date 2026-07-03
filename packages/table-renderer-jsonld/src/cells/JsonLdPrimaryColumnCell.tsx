import React from "react";
import { Avatar, Box, Link } from "@mui/material";
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

export const JSONLD_PRIMARY_IMAGE_KEY = "jsonLdPrimaryImageKey" as const;
export const JSONLD_PRIMARY_TYPE_NAME = "jsonLdPrimaryTypeName" as const;

function readStringMeta(meta: unknown, key: string): string | undefined {
  if (!meta || typeof meta !== "object") return undefined;
  const value = (meta as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Primary label column for JSON-LD rows: avatar (from the primary-field
 * image key) + label, clickable to open the entity detail view.
 * Mirrors the `PrimaryColumnContent` behavior of the sparql-select row shape.
 */
export function JsonLdPrimaryColumnCell({ cell, row }: CellProps) {
  const { onShowEntry } = useJsonLdTableContext();
  const meta = cell.column.columnDef.meta;
  const imageKey = readStringMeta(meta, JSONLD_PRIMARY_IMAGE_KEY);
  const typeName = readStringMeta(meta, JSONLD_PRIMARY_TYPE_NAME) ?? "";

  const original = row.original ?? {};
  const entityIRI =
    typeof original["@id"] === "string" ? original["@id"] : undefined;
  const typeIRI =
    typeof original["@type"] === "string" ? original["@type"] : undefined;
  const image =
    imageKey && typeof original[imageKey] === "string"
      ? (original[imageKey] as string)
      : undefined;

  const rawValue = cell.getValue();
  const label =
    rawValue == null || rawValue === "" ? entityIRI : String(rawValue);

  const content = (
    <Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      {image && (
        <Avatar
          alt=""
          variant={
            typeName.toLowerCase().includes("person") ? "circular" : "rounded"
          }
          sx={{ width: 42, height: 42 }}
          src={image}
        />
      )}
      <span>{label}</span>
    </Box>
  );

  if (!entityIRI || !onShowEntry) return content;

  return (
    <Link
      component="button"
      variant="body2"
      underline="hover"
      color="inherit"
      onClick={(e) => {
        e.preventDefault();
        onShowEntry(entityIRI, typeIRI);
      }}
    >
      {content}
    </Link>
  );
}
