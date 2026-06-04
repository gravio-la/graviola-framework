import React from "react";
import { Link, Typography } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

function displayUriLabel(href: string): string {
  return decodeURIComponent(
    href.substring(
      Math.max(href.lastIndexOf("/"), href.lastIndexOf("#")) + 1,
    ) || href,
  );
}

export function UriValueRenderer({ value }: ValueRendererProps) {
  if (value == null || value === "") return null;
  const href = String(value);
  return (
    <Link
      href={href}
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
      {displayUriLabel(href)}
    </Link>
  );
}
