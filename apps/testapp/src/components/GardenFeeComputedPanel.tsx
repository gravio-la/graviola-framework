import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useComputedFields } from "@graviola/formula-runtime-react";
import {
  BROWSER_FORM_HOST,
  selectLiveEvalSlots,
} from "@graviola/formula-runtime";
import { useMemo } from "react";
import {
  gardenFeeCompiledProfile,
  gardenFeeExpectedDemo,
  gardenFeeSampleData,
  gardenFeeSampleDataSouth,
} from "../garden-fee-schema";
import { calcDebug } from "../demo/calcDebug";

const liveGardenFeeProfile = selectLiveEvalSlots(
  gardenFeeCompiledProfile,
  BROWSER_FORM_HOST,
);

const SEED_GARDEN_NORTH = "https://example.org/garden/1";
const SEED_GARDEN_SOUTH = "https://example.org/garden/2";

/** CBD load may collapse nested named entities; seed demo merges fixture plot dimensions. */
export function documentForCalc(
  typeName: string,
  document: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!document || typeName !== "Garden") return document ?? {};
  const patch = document.patch as { plots?: unknown[] } | undefined;
  if (Array.isArray(patch?.plots) && patch.plots.length > 0) {
    return {
      ...document,
      vat_rate: Number(
        document.vat_rate ??
          (document["@id"] === SEED_GARDEN_SOUTH
            ? gardenFeeSampleDataSouth.vat_rate
            : gardenFeeSampleData.vat_rate),
      ),
    };
  }
  if (document["@id"] === SEED_GARDEN_SOUTH) {
    return {
      ...gardenFeeSampleDataSouth,
      ...document,
      fee_rate_per_sqm: Number(
        document.fee_rate_per_sqm ?? gardenFeeSampleDataSouth.fee_rate_per_sqm,
      ),
      vat_rate: Number(document.vat_rate ?? gardenFeeSampleDataSouth.vat_rate),
      patch: gardenFeeSampleDataSouth.patch,
    };
  }
  if (document["@id"] !== SEED_GARDEN_NORTH) return document;
  return {
    ...gardenFeeSampleData,
    ...document,
    fee_rate_per_sqm: Number(
      document.fee_rate_per_sqm ?? gardenFeeSampleData.fee_rate_per_sqm,
    ),
    vat_rate: Number(document.vat_rate ?? gardenFeeSampleData.vat_rate),
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
  const { computed } = useComputedFields(liveGardenFeeProfile, calcSource);

  if (typeName !== "Garden") return null;

  calcDebug("GardenFeeComputedPanel", computed);

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="subtitle2" gutterBottom>
        Live computed (formula-runtime) — strata 3–5
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label={`total_billable: ${computed.total_billable ?? "—"}`} />
        <Chip
          color={
            computed.annual_fee === gardenFeeExpectedDemo.gardenAnnualFee
              ? "success"
              : "default"
          }
          label={`annual_fee: ${computed.annual_fee ?? "—"}`}
        />
        <Chip
          color={
            Math.abs(
              Number(computed.annual_fee_gross) -
                gardenFeeExpectedDemo.gardenAnnualFeeGross,
            ) < 0.01
              ? "success"
              : "default"
          }
          label={`annual_fee_gross: ${computed.annual_fee_gross ?? "—"}`}
        />
      </Stack>
    </Box>
  );
}

export function CalcDebugToggle() {
  return (
    <Button
      size="small"
      variant="text"
      onClick={() => {
        const next = !(
          typeof window !== "undefined" &&
          window.localStorage.getItem("graviola:calc-debug") === "1"
        );
        window.localStorage.setItem("graviola:calc-debug", next ? "1" : "0");
        calcDebug("toggled", next);
        // eslint-disable-next-line no-console
        console.info(
          `[graviola:calc] debug ${next ? "ON" : "OFF"} — reload traces with ?calcDebug=1`,
        );
      }}
    >
      Toggle calc debug
    </Button>
  );
}
