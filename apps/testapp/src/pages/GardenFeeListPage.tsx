import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { SemanticTable } from "@graviola/edb-table-components";
import { useCallback } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import type { SchemaRouteOutletContext } from "../schemaOutletContext";
import {
  gardenFeeExpectedDemo,
  gardenFeeExpectedSouth,
} from "../garden-fee-schema";
import { CalcDebugToggle } from "../components/GardenFeeComputedPanel";
import { StratificationStoryPanel } from "../components/StratificationStoryPanel";

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
      <Box sx={{ px: 2, pt: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Typography variant="h6">Garden list — materialized fees</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              to="/garden-fee/present"
              size="small"
              variant="outlined"
            >
              Presentation hub
            </Button>
            <CalcDebugToggle />
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary" paragraph>
          Two allotments, same calc profile. Columns come from the Oxigraph seed
          (materialized), not from a client-side table formula. Open a row for
          live recomputation, stratum chips, and provenance modals.
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ mb: 1 }}
        >
          <Chip
            size="small"
            color="success"
            label={`North · net ${gardenFeeExpectedDemo.gardenAnnualFee} / gross ${gardenFeeExpectedDemo.gardenAnnualFeeGross}`}
          />
          <Chip
            size="small"
            color="success"
            label={`South · net ${gardenFeeExpectedSouth.gardenAnnualFee} / gross ${gardenFeeExpectedSouth.gardenAnnualFeeGross}`}
          />
        </Stack>
        {typeName === "Garden" ? <StratificationStoryPanel dense /> : null}
      </Box>
      <SemanticTable
        typeName={typeName}
        rowShape="jsonld"
        tableUiSchema={schemaConfig.tableUiSchema}
        onEditEntry={onEditEntry}
        onShowEntry={onShowEntry}
      />
    </Box>
  );
}
