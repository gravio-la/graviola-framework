import { useId, useState, type ReactNode } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  Box,
  ButtonBase,
  Collapse,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";

export type NestedSectionProps = {
  label: ReactNode;
  /** Right of the label — statement badges, counts. Not part of the toggle button. */
  adornment?: ReactNode;
  /** Shown after the label while collapsed. */
  summary?: ReactNode;
  /** Section starts expanded. Default true. */
  defaultExpanded?: boolean;
  /** When false, header + body without caret or toggle. Default true. */
  collapsible?: boolean;
  /** Suppress the guide rule / indent for children. */
  flat?: boolean;
  children: ReactNode;
};

/** Shared indent token for nested detail subtrees. */
export const nestingGuideSx: SxProps<Theme> = {
  ml: 0.75,
  pl: 1.25,
  borderLeft: "1px solid",
  borderColor: "divider",
};

export function NestedSection({
  label,
  adornment,
  summary,
  defaultExpanded = true,
  collapsible = true,
  flat = false,
  children,
}: NestedSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isExpanded = collapsible ? expanded : true;
  const panelId = useId();
  const labelText =
    typeof label === "string"
      ? label
      : typeof summary === "string"
        ? summary
        : "section";

  const headerLabel =
    typeof label === "string" ? (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600 }}
      >
        {label}
      </Typography>
    ) : (
      label
    );

  const header = collapsible ? (
    <ButtonBase
      onClick={() => setExpanded((v) => !v)}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.25,
        borderRadius: 0.5,
        py: 0.125,
        px: 0.25,
        mx: -0.25,
        "&:hover .nested-section-label": { color: "text.primary" },
      }}
      aria-expanded={isExpanded}
      aria-controls={panelId}
      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${labelText}`}
    >
      <KeyboardArrowDownIcon
        aria-hidden
        sx={{
          fontSize: 14,
          color: "text.secondary",
          transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 120ms",
        }}
      />
      <Box className="nested-section-label">{headerLabel}</Box>
      {!isExpanded && summary ? (
        <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
          {summary}
        </Typography>
      ) : null}
    </ButtonBase>
  ) : (
    headerLabel
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "wrap",
          mb: isExpanded ? 0.25 : 0,
        }}
      >
        {header}
        {adornment}
      </Box>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit={false}>
        <Box
          id={panelId}
          role="region"
          sx={flat ? { pt: 0.25 } : { ...nestingGuideSx, pt: 0.25 }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
