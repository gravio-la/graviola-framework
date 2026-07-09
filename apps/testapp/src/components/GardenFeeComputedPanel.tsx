import { Box, Chip, Stack, Typography } from "@mui/material";
import { useComputedFields } from "@graviola/formula-runtime-react";
import { useFormData } from "@graviola/edb-state-hooks";
import {
  gardenFeeCompiledProfile,
  gardenFeeExpected,
} from "../garden-fee-schema";

export function GardenFeeComputedPanel({
  typeName,
  entityIRI,
}: {
  typeName: string;
  entityIRI: string;
}) {
  const { data } = useFormData(typeName, entityIRI);
  const computed = useComputedFields(
    gardenFeeCompiledProfile,
    (data ?? {}) as Record<string, unknown>,
  );

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
