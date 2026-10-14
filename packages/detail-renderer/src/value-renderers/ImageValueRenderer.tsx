import React, { useMemo, useState } from "react";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import { Avatar, Box, Link } from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";

import { shouldUseImagePlaceholder } from "../utils/imagePlaceholder";

function ImagePlaceholderBox({
  sx,
  size,
}: {
  sx?: Record<string, unknown>;
  size?: number;
}) {
  return (
    <Box
      className="graviola-detail-image-placeholder"
      aria-hidden
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "action.hover",
        color: "text.disabled",
        borderRadius: 1,
        width: size ?? "100%",
        height: size ?? "auto",
        minHeight: size ?? 120,
        ...sx,
      }}
    >
      <ImageNotSupportedOutlinedIcon
        sx={{ fontSize: size ? size * 0.45 : "2rem", opacity: 0.55 }}
      />
    </Box>
  );
}

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

  const [failed, setFailed] = useState(false);
  const placeholder = shouldUseImagePlaceholder(failed, src ?? raw);

  if (raw == null) return null;

  if (detailField && typeof options?.size !== "number") {
    if (placeholder) {
      return <ImagePlaceholderBox sx={{ maxWidth: "100%", width: "100%" }} />;
    }
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
          onError={() => setFailed(true)}
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

  if (placeholder) {
    return (
      <ImagePlaceholderBox
        size={size}
        sx={{ width: size, height: size, minHeight: size }}
      />
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
        imgProps={{ onError: () => setFailed(true) }}
        sx={{ width: size, height: size }}
      />
    </Link>
  );
}
