import { Box, Typography } from "@mui/material";
import type { DetailViewConfig } from "@graviola/edb-detail-renderer-core";
import { generateDefaultDetailUISchema } from "@graviola/edb-detail-renderer";
import { flattenMetaSchemaProfile } from "@graviola/meta-schema";
import type { UISchemaElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import { useMemo } from "react";

import { SemanticDetailViewNoOps } from "./SemanticDetailView";

export type SemanticAnnotationsViewProps = {
  meta?: unknown;
  metaSchema: JSONSchema7;
  uiSchema?: UISchemaElement;
  config?: Partial<DetailViewConfig>;
  title?: string;
};

export function SemanticAnnotationsView({
  meta,
  metaSchema,
  uiSchema,
  config,
  title = "Metadaten",
}: SemanticAnnotationsViewProps) {
  const resolvedMetaSchema = useMemo(
    () => flattenMetaSchemaProfile(metaSchema),
    [metaSchema],
  );

  if (!meta || typeof meta !== "object") {
    return null;
  }

  const resolvedUiSchema =
    uiSchema ??
    generateDefaultDetailUISchema(resolvedMetaSchema as never, {
      layoutType: "VerticalLayout",
    });

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ mb: 1, display: "block" }}
      >
        {title}
      </Typography>
      <SemanticDetailViewNoOps
        data={meta}
        schema={resolvedMetaSchema}
        uiSchema={resolvedUiSchema}
        config={config}
      />
    </Box>
  );
}
