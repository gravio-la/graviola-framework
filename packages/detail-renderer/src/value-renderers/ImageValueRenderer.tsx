import React, { useMemo } from "react";
import { Avatar, Box, Link } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";

/**
 * Renders an image URL as a thumbnail linking to the full image.
 *
 * Selected structurally for `format: "uri"` + `contentMediaType: "image/*"`,
 * or explicitly via `options.valueRenderer: "image"`.
 *
 * Renderer options: `size` (px, default 42), `variant` ("rounded" | "circular").
 * In detail view, renders a contained image instead of a small avatar.
 */
export function ImageValueRenderer({
  value,
  options,
  ctx,
}: ValueRendererProps) {
  const raw = value == null || value === "" ? undefined : String(value);
  const size = typeof options?.size === "number" ? options.size : 42;
  const variant = options?.variant === "circular" ? "circular" : "rounded";
  const viewSize = ctx?.viewSize;
  const detailField =
    viewSize === undefined ||
    viewSize === "detail" ||
    (typeof options?.size === "number" && options.size > 64);

  const thumbSize = useMemo(
    () =>
      typeof options?.size === "number"
        ? { dimension: { width: size, height: size } }
        : detailField
          ? { sizeCategory: "detail" as const }
          : { sizeCategory: "listItem" as const },
    [detailField, options?.size, size],
  );
  const src = useThumbnailUrl(raw, thumbSize, {
    viewSize: ctx?.viewSize,
    typeName: ctx?.typeName,
    typeIRI: ctx?.typeIRI,
    entityIRI: ctx?.entityIRI,
  });

  if (raw == null) return null;

  if (detailField && typeof options?.size !== "number") {
    return (
      <Link
        href={raw}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: "block", maxWidth: "100%" }}
      >
        <Box
          component="img"
          src={src}
          alt=""
          loading="lazy"
          sx={{
            display: "block",
            maxWidth: "100%",
            height: "auto",
            borderRadius: 1,
            objectFit: "contain",
          }}
        />
      </Link>
    );
  }

  return (
    <Link
      href={raw}
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
