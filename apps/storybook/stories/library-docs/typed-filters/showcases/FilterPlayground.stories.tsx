import React, { useEffect, useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Alert,
  Box,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { withGeoSampleData } from "../../../../.storybook/decorators";
import { FilterPipelineLive } from "./FilterPipelineLive";

type FilterSource = "controls" | "json";

type PlaygroundArgs = {
  source: FilterSource;
  typeName: "City" | "Place";
  populationLt: number | null;
  nameContains: string;
  take: number;
};

const DEFAULT_JSON = `{
  "where": {
    "population": { "lt": 20000 },
    "name": { "contains": "burg" }
  }
}`;

function buildOptionsFromKnobs(args: PlaygroundArgs): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (
    typeof args.populationLt === "number" &&
    !Number.isNaN(args.populationLt)
  ) {
    where.population = { lt: args.populationLt };
  }
  if (args.nameContains.trim()) {
    where.name = { contains: args.nameContains.trim() };
  }
  return Object.keys(where).length > 0 ? { where } : {};
}

function pretty(options: Record<string, unknown>): string {
  return JSON.stringify(options, null, 2);
}

function PlaygroundCanvas(args: PlaygroundArgs) {
  // Canvas toggle can diverge briefly from the Controls radio; when the
  // Storybook `source` arg changes, prefer that and clear the override.
  const [sourceOverride, setSourceOverride] = useState<FilterSource | null>(
    null,
  );
  const [jsonDraft, setJsonDraft] = useState(DEFAULT_JSON);

  useEffect(() => {
    setSourceOverride(null);
  }, [args.source]);

  const source = sourceOverride ?? args.source;

  const knobsOptions = useMemo(() => buildOptionsFromKnobs(args), [args]);
  const knobsJson = useMemo(() => pretty(knobsOptions), [knobsOptions]);

  const handleSourceChange = (
    _: React.MouseEvent<HTMLElement>,
    next: FilterSource | null,
  ) => {
    if (!next || next === source) return;
    if (next === "json") {
      setJsonDraft(knobsJson === "{}" ? DEFAULT_JSON : knobsJson);
    }
    setSourceOverride(next);
  };

  const { filterOptions, parseError } = useMemo(() => {
    if (source === "controls") {
      return { filterOptions: knobsOptions, parseError: null as string | null };
    }
    try {
      const parsed = JSON.parse(jsonDraft);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {
          filterOptions: knobsOptions,
          parseError: "JSON root must be an object",
        };
      }
      return {
        filterOptions: parsed as Record<string, unknown>,
        parseError: null,
      };
    } catch (err) {
      return {
        filterOptions: knobsOptions,
        parseError: err instanceof Error ? err.message : String(err),
      };
    }
  }, [source, knobsOptions, jsonDraft]);

  const description =
    source === "controls"
      ? `Playground (Controls) · ${args.typeName}`
      : `Playground (JSON) · ${args.typeName}`;

  return (
    <Box>
      <Stack spacing={2} sx={{ p: 2, pb: 0 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Typography variant="body2" color="text.secondary">
            Choose <strong>one</strong> source for the filter. The other is
            ignored — Controls and JSON no longer fight.
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={source}
            onChange={handleSourceChange}
            aria-label="Filter source"
          >
            <ToggleButton value="controls">Controls</ToggleButton>
            <ToggleButton value="json">JSON</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {source === "controls" ? (
          <TextField
            label="Derived filter (read-only — edit via Controls)"
            multiline
            minRows={6}
            maxRows={14}
            value={knobsJson}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: "Consolas, Monaco, monospace", fontSize: 13 },
            }}
            helperText="Change populationLt / nameContains in the Controls panel. Switch to JSON to edit freely."
            fullWidth
          />
        ) : (
          <TextField
            label="Filter options (JSON)"
            multiline
            minRows={8}
            maxRows={16}
            value={jsonDraft}
            onChange={(e) => setJsonDraft(e.target.value)}
            error={Boolean(parseError)}
            helperText={
              parseError
                ? `Parse error — falling back to last valid Controls filter. ${parseError}`
                : "populationLt / nameContains Controls are ignored in JSON mode. typeName and take still apply."
            }
            fullWidth
            InputProps={{
              sx: { fontFamily: "Consolas, Monaco, monospace", fontSize: 13 },
            }}
          />
        )}

        {source === "json" && parseError && (
          <Alert severity="warning">
            Invalid JSON — showing the Controls-derived filter until the draft
            parses again.
          </Alert>
        )}
        {source === "controls" && (
          <Alert severity="info" variant="outlined">
            Active source: Controls. JSON editor is inactive.
          </Alert>
        )}
      </Stack>
      <FilterPipelineLive
        description={description}
        typeName={args.typeName}
        filterOptions={filterOptions}
        limit={args.take > 0 ? args.take : undefined}
      />
    </Box>
  );
}

const meta: Meta<PlaygroundArgs> = {
  title: "Library Docs/Typed Filters/Playground",
  decorators: [withGeoSampleData],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    source: {
      control: "radio",
      options: ["controls", "json"],
      description:
        "Exclusive filter source. Controls ↔ JSON — never both at once.",
    },
    typeName: {
      control: "select",
      options: ["City", "Place"],
    },
    populationLt: {
      control: { type: "number", min: 0, max: 500_000, step: 1000 },
      if: { arg: "source", eq: "controls" },
    },
    nameContains: {
      control: "text",
      if: { arg: "source", eq: "controls" },
    },
    take: {
      control: { type: "number", min: 0, max: 200 },
      description: "Maps to filterMany limit (0 = unlimited)",
    },
  },
  args: {
    source: "controls",
    typeName: "City",
    populationLt: 20_000,
    nameContains: "burg",
    take: 50,
  },
  render: (args) => <PlaygroundCanvas {...args} />,
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Interactive: Story = {};

export const KnobsOnly: Story = {
  args: {
    source: "controls",
    populationLt: 10_000,
    nameContains: "",
    take: 20,
  },
};

export const JsonOnly: Story = {
  args: {
    source: "json",
    populationLt: null,
    nameContains: "",
  },
};
