import { Box, Chip, Stack, Typography } from "@mui/material";
import { useComputedFields } from "@graviola/formula-runtime-react";
import { useMemo } from "react";
import {
  gardenFeeCompiledProfile,
  gardenFeeExpected,
  gardenFeeSampleData,
} from "../garden-fee-schema";

const SEED_GARDEN_IRI = "https://example.org/garden/1";

/** CBD load may collapse nested named entities; seed demo merges fixture plot dimensions. */
function documentForCalc(
  typeName: string,
  document: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!document || typeName !== "Garden") return document ?? {};
  const patch = document.patch as { plots?: unknown[] } | undefined;
  if (Array.isArray(patch?.plots) && patch.plots.length > 0) return document;
  if (document["@id"] !== SEED_GARDEN_IRI) return document;
  return {
    ...gardenFeeSampleData,
    ...document,
    fee_rate_per_sqm: Number(
      document.fee_rate_per_sqm ?? gardenFeeSampleData.fee_rate_per_sqm,
    ),
    patch: gardenFeeSampleData.patch,
  };
}

export function GardenFeeComputedPanel({
  typeName,
  document,
}: {
  typeName: string;
  document: Record<string, unknown> | undefined;
}) {
  const calcSource = useMemo(
    () => documentForCalc(typeName, document),
    [typeName, document],
  );
  const { computed } = useComputedFields(gardenFeeCompiledProfile, calcSource);

  if (typeName !== "Garden") return null;

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="subtitle2" gutterBottom>
        Live computed fields
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label={`total_billable: ${computed.total_billable ?? "—"}`} />
        <Chip
          color={
            computed.annual_fee === gardenFeeExpected.gardenAnnualFee
              ? "success"
              : "default"
          }
          label={`annual_fee: ${computed.annual_fee ?? "—"}`}
        />
      </Stack>
    </Box>
  );
}
