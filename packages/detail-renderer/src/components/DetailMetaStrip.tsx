import React from "react";
import { Box, Typography } from "@mui/material";

import { DetailPresentationProvider } from "../detailPresentationContext";

export function DetailMetaStrip({ children }: { children: React.ReactNode }) {
  return (
    <DetailPresentationProvider value={{ metaStrip: true }}>
      <Box
        className="graviola-detail-meta-strip"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          alignItems: "flex-start",
          py: 0.5,
        }}
      >
        {children}
      </Box>
    </DetailPresentationProvider>
  );
}

export function DetailMetaStripItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 500, display: "block", lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Box sx={{ mt: 0.25 }}>{children}</Box>
    </Box>
  );
}
