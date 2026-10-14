import React from "react";
import { Typography } from "@mui/material";

export function DetailIriFooter({ entityIRI }: { entityIRI?: string }) {
  if (!entityIRI) return null;
  return (
    <Typography
      variant="caption"
      color="text.disabled"
      component="p"
      sx={{
        mt: 4,
        pt: 2,
        borderTop: 1,
        borderColor: "divider",
        fontFamily: "monospace",
        fontSize: "0.7rem",
        wordBreak: "break-all",
      }}
    >
      {entityIRI}
    </Typography>
  );
}
