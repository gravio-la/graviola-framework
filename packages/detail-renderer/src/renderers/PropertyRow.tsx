import React from "react";
import { Box, Typography } from "@mui/material";

import { DetailMetaStripItem } from "../components/DetailMetaStrip";
import { useDetailPresentation } from "../detailPresentationContext";

/**
 * Two-column property row: label on the left, value on the right.
 * With an empty or whitespace-only `label`, uses a compact single-column layout.
 */
export function PropertyRow({
  label,
  children,
  stacked,
}: {
  label: string;
  children: React.ReactNode;
  /** Label above value (nested detail rows). */
  stacked?: boolean;
}) {
  const { metaStrip, compactLeafInline, hideInlineLabels } =
    useDetailPresentation();
  const showLabelColumn = typeof label === "string" && label.trim().length > 0;

  if (metaStrip && showLabelColumn) {
    return <DetailMetaStripItem label={label}>{children}</DetailMetaStripItem>;
  }

  if (compactLeafInline) {
    if (hideInlineLabels || !showLabelColumn) {
      return <Box sx={{ minWidth: 0 }}>{children}</Box>;
    }
    return (
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500, display: "block", mb: 0.25 }}
        >
          {label}
        </Typography>
        {children}
      </Box>
    );
  }

  if (!showLabelColumn) {
    return <Box sx={{ py: 0.25 }}>{children}</Box>;
  }

  if (stacked) {
    return (
      <Box sx={{ py: 0.25 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500, display: "block", mb: 0.25 }}
        >
          {label}
        </Typography>
        <Box>{children}</Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "30% 1fr",
        gap: 1,
        alignItems: "flex-start",
        py: 0.25,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ pt: 0.5, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
}
