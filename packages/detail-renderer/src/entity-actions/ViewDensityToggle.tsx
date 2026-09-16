import React from "react";
import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import ViewHeadlineIcon from "@mui/icons-material/ViewHeadline";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import type { ViewDensity } from "@graviola/edb-core-types";
import { useViewDensity } from "@graviola/edb-state-hooks";

export type ViewDensityToggleProps = {
  /** When `local`, changes apply to the nearest nested provider only. */
  scope?: "global" | "local";
  size?: "small" | "medium";
};

export function ViewDensityToggle({
  scope = "global",
  size = "small",
}: ViewDensityToggleProps) {
  const { density, setDensity, isOverride } = useViewDensity();

  if (scope === "local" && !isOverride) {
    return null;
  }

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    next: ViewDensity | null,
  ) => {
    if (next) setDensity(next);
  };

  return (
    <ToggleButtonGroup
      size={size}
      exclusive
      value={density}
      onChange={handleChange}
      aria-label="view density"
    >
      <ToggleButton value="condensed" aria-label="condensed view">
        <Tooltip title="Condensed">
          <ViewHeadlineIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="extended" aria-label="extended view">
        <Tooltip title="Extended">
          <ViewAgendaIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
