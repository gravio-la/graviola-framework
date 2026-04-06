import { Box, Typography } from "@mui/material";
import { GenericForm } from "@graviola/semantic-json-form";
import { useParams } from "react-router-dom";
import { useEntityIRIFromEntityID } from "../useEntityIRIFromEntityID";

export function GenericDetailPage() {
  const { typeName, entityID } = useParams<{
    typeName: string;
    entityID: string;
  }>();
  const entityIRI = useEntityIRIFromEntityID(entityID);

  if (!typeName || !entityIRI) {
    return (
      <Typography color="error">Invalid detail route parameters.</Typography>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 900 }}>
      <Typography variant="h5" gutterBottom>
        {typeName} (read-only)
      </Typography>
      <GenericForm
        entityIRI={entityIRI}
        typeName={typeName}
        forceEditMode={false}
        defaultEditMode={false}
      />
    </Box>
  );
}
