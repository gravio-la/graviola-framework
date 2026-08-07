import { Box, Typography } from "@mui/material";
import { GenericForm } from "@graviola/semantic-json-form";
import { useParams } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { useEntityIRIFromEntityID } from "../useEntityIRIFromEntityID";
import type { SchemaRouteOutletContext } from "../schemaOutletContext";
import { GardenFeeComputedPanel } from "../components/GardenFeeComputedPanel";

export function GenericEditPage() {
  const { typeName, entityID } = useParams<{
    typeName: string;
    entityID: string;
  }>();
  const entityIRI = useEntityIRIFromEntityID(entityID);
  const { schemaConfig } = useOutletContext<SchemaRouteOutletContext>();

  if (!typeName || !entityIRI) {
    return (
      <Typography color="error">Invalid edit route parameters.</Typography>
    );
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
      <Box sx={{ p: 2, maxWidth: 900 }}>
        <Typography variant="h5" gutterBottom>
          Edit {typeName}
        </Typography>
        <GenericForm entityIRI={entityIRI} typeName={typeName} />
        {schemaConfig.schemaName === "garden-fee" && (
          <GardenFeeComputedPanel
            typeName={typeName}
            document={{ "@id": entityIRI }}
          />
        )}
      </Box>
    </Box>
  );
}
