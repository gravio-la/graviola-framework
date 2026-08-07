import { Box, Chip, Stack, Typography } from "@mui/material";
import {
  useAdbContext,
  useDataStore,
  useQuery,
} from "@graviola/edb-state-hooks";
import { evaluateForRoots } from "@graviola/calc-engine";
import { gardenFeeSchema } from "@graviola/calc-fixtures";
import type { JSONSchema7 } from "json-schema";
import { gardenFeeExpected } from "../garden-fee-schema";

/**
 * Computed-fields demo panel. A CBD `loadOne` stops at nested named entities,
 * so the calc input tree (Garden → Patch → Plots) is read through the store's
 * `filterMany` with the profile's precise read plan — which is exactly what
 * `evaluateForRoots` does in one batched query.
 */
export function GardenFeeComputedPanel({
  typeName,
  document,
}: {
  typeName: string;
  document: Record<string, unknown> | undefined;
}) {
  const { dataStore, ready } = useDataStore();
  const { calcProfile } = useAdbContext();
  const entityIRI = document?.["@id"] as string | undefined;
  const canEvaluate =
    typeName === "Garden" &&
    Boolean(entityIRI) &&
    Boolean(calcProfile) &&
    ready &&
    typeof (dataStore as { filterMany?: unknown })?.filterMany === "function";

  const { data } = useQuery({
    // `document` in the key re-evaluates after each save of the entity.
    queryKey: ["garden-fee-calc", entityIRI, document],
    queryFn: () =>
      evaluateForRoots(
        dataStore as never,
        calcProfile!,
        "Garden",
        gardenFeeSchema as JSONSchema7,
        { rootIRIs: [entityIRI!] },
      ),
    enabled: canEvaluate,
  });

  if (typeName !== "Garden") return null;

  const computed = (data?.values?.[0] ?? {}) as Record<string, unknown>;

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
