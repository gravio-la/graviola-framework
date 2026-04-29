import React from "react";
import { Link, Typography } from "@mui/material";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { PropertyRow } from "./PropertyRow";

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i;

export function UriRenderer({ label, data }: DetailRendererProps) {
  if (data == null || data === "") return null;
  const href = String(data);

  if (IMAGE_EXT_RE.test(href)) {
    return (
      <PropertyRow label={label}>
        <img
          src={href}
          alt={label}
          style={{ maxHeight: "8em", maxWidth: "100%", objectFit: "contain" }}
        />
      </PropertyRow>
    );
  }

  return (
    <PropertyRow label={label}>
      <Link href={href} target="_blank" rel="noopener noreferrer">
        <Typography
          variant="body2"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {decodeURIComponent(
            href.substring(
              Math.max(href.lastIndexOf("/"), href.lastIndexOf("#")) + 1,
            ) || href,
          )}
        </Typography>
      </Link>
    </PropertyRow>
  );
}
