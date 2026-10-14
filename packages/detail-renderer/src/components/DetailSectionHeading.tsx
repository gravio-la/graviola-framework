import React from "react";
import { Typography } from "@mui/material";

/** Depth-0 section title for object/array property groups in detail view. */
export function DetailSectionHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  if (children == null || children === "") return null;
  return (
    <Typography
      component="h2"
      variant="subtitle1"
      fontWeight={600}
      sx={{ mt: 3, mb: 1, color: "text.primary" }}
    >
      {children}
    </Typography>
  );
}
