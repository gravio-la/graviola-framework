import React from "react";
import { EntityChip } from "@graviola/edb-advanced-components";
import type { ChipRendererProps } from "@graviola/edb-detail-renderer-core";

/**
 * Delegates to the existing EntityChip from advanced-components.
 * Used when schema represents an entity reference (has @id property).
 */
export function EntityChipRenderer({
  data,
  definition,
  onClick,
}: ChipRendererProps) {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const entityIRI = d["@id"];
  const typeIRI = d["@type"];
  if (!entityIRI || typeof entityIRI !== "string") return null;

  return (
    <EntityChip
      entityIRI={entityIRI}
      typeIRI={typeof typeIRI === "string" ? typeIRI : undefined}
      data={data}
      size="small"
      onClick={onClick as any}
    />
  );
}
