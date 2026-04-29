import { Box, Typography } from "@mui/material";
import { GenericForm } from "@graviola/semantic-json-form";
import { useAdbContext } from "@graviola/edb-state-hooks";
import { useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import type { SchemaRouteOutletContext } from "../schemaOutletContext";

export function GenericCreatePage() {
  const { typeName } = useParams<{ typeName: string }>();
  const { schemaConfig } = useOutletContext<SchemaRouteOutletContext>();
  const { createEntityIRI, typeNameToTypeIRI } = useAdbContext();

  const typeIRI = useMemo(
    () => (typeName ? typeNameToTypeIRI(typeName) : undefined),
    [typeName, typeNameToTypeIRI],
  );

  const newEntityIRI = useMemo(
    () => (typeName ? createEntityIRI(typeName) : undefined),
    [typeName, createEntityIRI],
  );

  if (!typeName || !schemaConfig || !typeIRI) {
    return (
      <Typography color="error">Missing type name for this schema.</Typography>
    );
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
      <Box sx={{ p: 2, maxWidth: 900 }}>
        <Typography variant="h5" gutterBottom>
          Create {typeName}
        </Typography>
        <GenericForm
          key={newEntityIRI}
          entityIRI={newEntityIRI}
          typeName={typeName}
        />
      </Box>
    </Box>
  );
}
