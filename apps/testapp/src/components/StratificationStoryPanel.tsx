import { Box, Chip, Paper, Stack, Typography, Tooltip } from "@mui/material";
import { gardenFeeCompiledProfile } from "../garden-fee-schema";
import { explainCompiledSlot } from "@graviola/formula-dependency";

type StratumCard = {
  stratum: number;
  property: string;
  entity: string;
  formula?: string;
  aggregate?: string;
  scope: string;
};

function stratumCards(): StratumCard[] {
  return Object.entries(gardenFeeCompiledProfile.slots)
    .map(([scope, slot]) => {
      const entity =
        slot.entityScope.match(/\/definitions\/([^/]+)$/)?.[1] ?? "?";
      return {
        stratum: slot.stratum,
        property: slot.propertyName,
        entity,
        formula: slot.formula,
        aggregate: slot.aggregate
          ? `${slot.aggregate.type}(${slot.aggregate.over}${slot.aggregate.field ? `.${slot.aggregate.field}` : ""})`
          : undefined,
        scope,
      };
    })
    .sort(
      (a, b) => a.stratum - b.stratum || a.property.localeCompare(b.property),
    );
}

const accent = ["#7cb342", "#43a047", "#2e7d32", "#1b5e20", "#004d40"];

/**
 * Visual stratification ladder for the garden-fee presentation —
 * derived from the compiled calc profile, not a hand-drawn diagram.
 */
export function StratificationStoryPanel({
  highlightStratum,
  dense,
}: {
  highlightStratum?: number;
  dense?: boolean;
}) {
  const cards = stratumCards();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: dense ? 1.5 : 2,
        mb: 2,
        background:
          "linear-gradient(135deg, rgba(85,139,47,0.06), rgba(255,255,255,0.9))",
      }}
    >
      <Typography variant={dense ? "subtitle2" : "h6"} gutterBottom>
        Stratification ladder (compiled profile)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Lower strata feed higher ones. Plot areas → patch sum → garden total →
        net fee → VAT gross. Each step is a calc-profile slot with a stratum
        number from the dependency compiler.
      </Typography>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems={{ md: "stretch" }}
        useFlexGap
        flexWrap="wrap"
      >
        {cards.map((card, i) => {
          const explained = explainCompiledSlot(
            gardenFeeCompiledProfile,
            card.scope,
          );
          const active =
            highlightStratum === undefined || highlightStratum === card.stratum;
          return (
            <Tooltip
              key={card.scope}
              title={
                <Box
                  component="pre"
                  sx={{ m: 0, whiteSpace: "pre-wrap", fontSize: 11 }}
                >
                  {explained}
                </Box>
              }
            >
              <Box
                sx={{
                  flex: "1 1 140px",
                  minWidth: 140,
                  p: 1.25,
                  borderRadius: 1,
                  border: 1,
                  borderColor: active ? accent[i % accent.length] : "divider",
                  opacity: active ? 1 : 0.45,
                  bgcolor: "background.paper",
                }}
              >
                <Stack spacing={0.5}>
                  <Chip
                    size="small"
                    label={`S${card.stratum}`}
                    sx={{
                      alignSelf: "flex-start",
                      bgcolor: accent[i % accent.length],
                      color: "#fff",
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {card.entity}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {card.property}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: "monospace", wordBreak: "break-word" }}
                  >
                    {card.formula ?? card.aggregate}
                  </Typography>
                </Stack>
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
      {!dense ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1.5, display: "block" }}
        >
          Hover a card for the full compiler explanation
          (`explainCompiledSlot`).
        </Typography>
      ) : null}
    </Paper>
  );
}
