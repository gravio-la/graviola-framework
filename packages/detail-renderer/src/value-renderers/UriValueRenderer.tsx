import React from "react";
import { Link } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

import { formatUriLinkText } from "../utils/formatUriLinkText";

export function UriValueRenderer({ value }: ValueRendererProps) {
  if (value == null || value === "") return null;
  const href = String(value);
  const linkText = formatUriLinkText(href);
  return (
    <Link
      href={href}
      title={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="inherit"
      sx={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "inline-block",
        maxWidth: "100%",
      }}
    >
      {linkText}
    </Link>
  );
}
