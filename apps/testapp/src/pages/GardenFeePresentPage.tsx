import {
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { StratificationStoryPanel } from "../components/StratificationStoryPanel";
import { gardenFeeExpectedDemo } from "../garden-fee-schema";
import { PRESENTATION_BEATS } from "../demo/presentationBeats";

/**
 * Guided presentation landing for the garden-fee calc + provenance story.
 * Open this before the live walkthrough; beats mirror the choreography doc.
 */
export function GardenFeePresentPage() {
  return (
    <Box sx={{ p: 2, maxWidth: 960, mx: "auto" }}>
      <Typography variant="overline" color="text.secondary">
        Graviola testapp · live demo
      </Typography>
      <Typography variant="h4" component="h1" gutterBottom>
        Calculated fields, stratification & provenance
      </Typography>
      <Typography paragraph color="text.secondary">
        A ~10 minute walkthrough of how Graviola keeps the domain schema pure,
        evaluates a calc profile by stratum, renders computed values via
        structural dispatch, and lets a curious user open fact-level and
        entity-level metadata — using the same DetailRenderer stack.
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 2 }}
      >
        <Chip
          color="success"
          label={`North net ${gardenFeeExpectedDemo.gardenAnnualFee}`}
        />
        <Chip
          color="success"
          label={`North gross ${gardenFeeExpectedDemo.gardenAnnualFeeGross}`}
        />
        <Chip label="5 strata" />
        <Chip label="3 provenance doors" />
        <Chip variant="outlined" label="English narration" />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 3 }}>
        <Button
          component={RouterLink}
          to="/garden-fee/list/Garden"
          variant="contained"
          color="success"
        >
          Start at Garden table
        </Button>
        <Button
          component={RouterLink}
          to="/garden-fee/detail/Garden/garden%2F1"
          variant="outlined"
        >
          Jump to Allotment North
        </Button>
        <Button
          component={RouterLink}
          to="/garden-fee/detail/Garden/garden%2F2"
          variant="outlined"
        >
          Jump to Allotment South
        </Button>
      </Stack>

      <StratificationStoryPanel />

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Learning goals
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          <li>
            Domain JSON Schema stays free of UI / calc / provenance pollution;
            sidecars and grafts carry concerns.
          </li>
          <li>
            Calc profiles compile to strata; evaluation is deterministic and
            layer-ordered.
          </li>
          <li>
            DetailRenderer dispatches on schema shape (`x-calc`, StatementNode,
            MetaSchema) — not on hard-coded property names.
          </li>
          <li>
            Provenance is explorable: field-level `$stmt`, statement arrays, and
            entity `$meta` all reuse structural detail rendering.
          </li>
        </Box>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Beats (follow in order)
      </Typography>
      <List dense>
        {PRESENTATION_BEATS.map((beat, index) => (
          <ListItemButton
            key={beat.id}
            component={RouterLink}
            to={beat.href}
            alignItems="flex-start"
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={`${index + 1}`} />
                  <Typography fontWeight={600}>{beat.title}</Typography>
                  <Chip size="small" variant="outlined" label={beat.duration} />
                </Stack>
              }
              secondary={
                <>
                  <Typography variant="body2" color="text.secondary">
                    {beat.summary}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, fontStyle: "italic" }}
                  >
                    Cue: {beat.spokenCue}
                  </Typography>
                </>
              }
            />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Full spoken script, timing, and presenter notes:{" "}
        <Box component="code" sx={{ fontSize: "0.85em" }}>
          apps/testapp/docs/calc-meta-demo-choreography.md
        </Box>
        . Enable console traces with <Box component="code">?calcDebug=1</Box>{" "}
        when showing internals.
      </Typography>
    </Box>
  );
}
