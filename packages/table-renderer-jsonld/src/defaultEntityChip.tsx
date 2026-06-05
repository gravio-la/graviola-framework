import React from "react";
import { Chip } from "@mui/material";

import type { JsonLdChipComponentProps } from "./JsonLdTableContext";

function entityLabel(
  data?: Record<string, unknown>,
  entityIRI?: string,
): string {
  if (!data) return entityIRI ?? "";
  const candidates = [
    "name",
    "documentTitle",
    "realmName",
    "filePath",
    "label",
  ];
  for (const key of candidates) {
    const v = data[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  if (typeof data["@id"] === "string") return data["@id"];
  return entityIRI ?? "";
}

/** Lightweight chip when no {@link JsonLdTableProvider} injection is supplied. */
export function DefaultEntityChip({
  data,
  entityIRI,
  onClick,
}: JsonLdChipComponentProps) {
  const label = entityLabel(data, entityIRI);
  if (!label) return null;
  return (
    <Chip
      size="small"
      label={label}
      onClick={onClick}
      clickable={Boolean(onClick)}
    />
  );
}
