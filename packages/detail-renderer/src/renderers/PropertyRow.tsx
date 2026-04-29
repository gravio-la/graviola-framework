import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Two-column property row: label on the left, value on the right.
 * Mirrors AllPropsTable's visual structure.
 */
export function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
