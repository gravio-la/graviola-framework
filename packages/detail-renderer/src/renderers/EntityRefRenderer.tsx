import React from "react";
import { EntityChip } from "@graviola/edb-advanced-components";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { PropertyRow } from "./PropertyRow";

export function EntityRefRenderer({ label, data }: DetailRendererProps) {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const entityIRI = d["@id"];
  const typeIRI = d["@type"];
  if (!entityIRI || typeof entityIRI !== "string") return null;

  return (
    <PropertyRow label={label}>
      <EntityChip
        entityIRI={entityIRI}
        typeIRI={typeof typeIRI === "string" ? typeIRI : undefined}
        data={data}
        size="small"
      />
    </PropertyRow>
  );
}
