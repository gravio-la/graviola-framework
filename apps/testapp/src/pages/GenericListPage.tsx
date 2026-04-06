import { Box, Typography } from "@mui/material";
import { SemanticTable } from "@graviola/edb-table-components";
import { useCallback } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { SchemaRouteOutletContext } from "../schemaOutletContext";

export function GenericListPage() {
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
    (id: string, _typeIRI: string) => {
      navigate(`${basePath}/edit/${typeName}/${toEntitySegment(id)}`);
    },
    [basePath, navigate, toEntitySegment, typeName],
  );

  const onShowEntry = useCallback(
    (id: string, _typeIRI: string) => {
      navigate(`${basePath}/detail/${typeName}/${toEntitySegment(id)}`);
    },
    [basePath, navigate, toEntitySegment, typeName],
  );

  if (!typeName) {
    return <Typography color="error">Missing type name in route.</Typography>;
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <SemanticTable
        typeName={typeName}
        onEditEntry={onEditEntry}
        onShowEntry={onShowEntry}
      />
    </Box>
  );
}
