import React from "react";
import { Stack } from "@mui/material";
import { EntityChip } from "@graviola/edb-advanced-components";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { PropertyRow } from "./PropertyRow";

export function ArrayEntityRenderer({ label, data }: DetailRendererProps) {
  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <PropertyRow label={label}>
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {data.map((item: unknown, index: number) => {
          if (item == null || typeof item !== "object") return null;
          const d = item as Record<string, unknown>;
          const entityIRI = d["@id"];
          const typeIRI = d["@type"];
          if (!entityIRI || typeof entityIRI !== "string") return null;
          return (
            <EntityChip
              key={entityIRI}
              index={index}
              entityIRI={entityIRI}
              typeIRI={typeof typeIRI === "string" ? typeIRI : undefined}
              data={item}
              size="small"
            />
          );
        })}
      </Stack>
    </PropertyRow>
  );
}
