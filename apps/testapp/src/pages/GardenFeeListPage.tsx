import { Box, Typography } from "@mui/material";
import { SemanticTable } from "@graviola/edb-table-components";
import { useCallback } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { SchemaRouteOutletContext } from "../schemaOutletContext";
import { gardenFeeExpected } from "../garden-fee-schema";

export function GardenFeeListPage() {
  const { typeName } = useParams<{ typeName: string }>();
  const { schemaConfig } = useOutletContext<SchemaRouteOutletContext>();
  const navigate = useNavigate();
  const basePath = `/${schemaConfig.schemaName}`;

  const toEntitySegment = useCallback(
    (id: string) =>
      id.startsWith(schemaConfig.entityBaseIRI) &&
      id.length > schemaConfig.entityBaseIRI.length
        ? encodeURIComponent(id.slice(schemaConfig.entityBaseIRI.length))
        : encodeURIComponent(id),
    [schemaConfig.entityBaseIRI],
  );

  const onEditEntry = useCallback(
    (id: string) => {
      navigate(`${basePath}/edit/${typeName}/${toEntitySegment(id)}`);
    },
    [basePath, navigate, toEntitySegment, typeName],
  );

  const onShowEntry = useCallback(
    (id: string) => {
      navigate(`${basePath}/detail/${typeName}/${toEntitySegment(id)}`);
    },
    [basePath, navigate, toEntitySegment, typeName],
  );

  if (!typeName) {
    return <Typography color="error">Missing type name in route.</Typography>;
  }

  return (
    <Box
      sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      <Typography variant="body2" sx={{ px: 2, py: 1 }}>
        Garden fee demo — open a Garden detail view for live computed annual_fee
        (expected {gardenFeeExpected.gardenAnnualFee} for the seed data).
      </Typography>
      <SemanticTable
        typeName={typeName}
        rowShape="jsonld"
        onEditEntry={onEditEntry}
        onShowEntry={onShowEntry}
      />
    </Box>
  );
}
