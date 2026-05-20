import React from "react";
import type { ControlElement } from "@jsonforms/core";
import { extendPropertyScope } from "@graviola/edb-detail-renderer-core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { EntityChip } from "@graviola/edb-advanced-components";
import type { JSONSchema7 } from "json-schema";
import { Box, Typography } from "@mui/material";

import { PropertyRow } from "./PropertyRow";

/** Entity refs as chips when `@id` is present; otherwise inline property dispatch for embedded entities. */
export function NamedEntityRenderer({
  label,
  data,
  schema,
  uiSchema,
  dispatch,
  ctx,
}: DetailRendererProps) {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const entityIRI = d["@id"];
  const typeIRI = d["@type"];

  if (typeof entityIRI === "string" && entityIRI.length > 0) {
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

  const s = schema as JSONSchema7;
  if (!s.properties) return null;

  const parentScope = (uiSchema as ControlElement).scope ?? "#";
  const children = Object.entries(s.properties)
    .filter(([key]) => !key.startsWith("@"))
    .map(([key]) => {
      const childScope = extendPropertyScope(parentScope, key);
      const childUi: ControlElement = {
        type: "Control",
        scope: childScope,
      };
      return dispatch({ uiSchema: childUi, ctx });
    })
    .filter(Boolean);

  if (children.length === 0) return null;

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          pl: 2,
          borderLeft: "2px solid",
          borderColor: "divider",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
