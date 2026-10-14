import React from "react";
import { Typography } from "@mui/material";

import { useDetailPresentation } from "../detailPresentationContext";

export function CompactNumericSpan({
  children,
}: {
  children: React.ReactNode;
}) {
  const { compactNumericColumn } = useDetailPresentation();
  return (
    <Typography
      variant="inherit"
      component="span"
      className={
        compactNumericColumn ? "graviola-detail-compact-numeric" : undefined
      }
      sx={
        compactNumericColumn
          ? {
              display: "inline-block",
              minWidth: "4ch",
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }
          : undefined
      }
    >
      {children}
    </Typography>
  );
}
