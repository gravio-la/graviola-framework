import React from "react";
import { Avatar, Link } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

/**
 * Renders an image URL as a thumbnail linking to the full image.
 *
 * Selected structurally for `format: "uri"` + `contentMediaType: "image/*"`,
 * or explicitly via `options.valueRenderer: "image"`.
 *
 * Renderer options: `size` (px, default 42), `variant` ("rounded" | "circular").
 */
export function ImageValueRenderer({ value, options }: ValueRendererProps) {
  if (value == null || value === "") return null;
  const src = String(value);
  const size = typeof options?.size === "number" ? options.size : 42;
  const variant = options?.variant === "circular" ? "circular" : "rounded";
  return (
    <Link
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ display: "inline-flex" }}
    >
      <Avatar
        variant={variant}
        src={src}
        alt=""
        sx={{ width: size, height: size }}
      />
    </Link>
  );
}
