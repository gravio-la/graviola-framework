import React from "react";
import { Avatar, Chip, Typography } from "@mui/material";
import type { ChipRendererProps } from "@graviola/edb-detail-renderer-core";

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i;
const AUDIO_VIDEO_EXT_RE = /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i;

export { IMAGE_EXT_RE, AUDIO_VIDEO_EXT_RE };

export function MediaChipRenderer({
  data,
  definition,
  onClick,
  variant,
}: ChipRendererProps) {
  const src = typeof data === "string" ? data : null;
  if (!src || !IMAGE_EXT_RE.test(src)) return null;

  const label = definition.label(data, {} as any) ?? src;

  if (variant === "label") {
    return (
      <Typography variant="caption">
        <img
          src={src}
          alt={label}
          style={{
            height: "1.2em",
            width: "1.2em",
            objectFit: "cover",
            borderRadius: 2,
            verticalAlign: "middle",
            marginRight: 4,
          }}
        />
        {label}
      </Typography>
    );
  }

  return (
    <Chip
      avatar={<Avatar src={src} alt={label} />}
      label={label}
      size="small"
      onClick={onClick}
    />
  );
}
