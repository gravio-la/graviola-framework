import React from "react";
import { Chip, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import type { ChipRendererProps } from "@graviola/edb-detail-renderer-core";

const PLAYABLE_EXT_RE = /\.(mp4|webm|ogg|mp3|wav|flac|aac|opus)(\?.*)?$/i;
export { PLAYABLE_EXT_RE };

export function PlayableChipRenderer({
  data,
  definition,
  onClick,
  variant,
}: ChipRendererProps) {
  const src = typeof data === "string" ? data : null;
  if (!src || !PLAYABLE_EXT_RE.test(src)) return null;

  const label = definition.label(data, {} as any) ?? src;

  if (variant === "label") {
    return (
      <Typography
        variant="caption"
        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
      >
        <PlayArrowIcon fontSize="small" />
        {label}
      </Typography>
    );
  }

  return (
    <Chip
      icon={<PlayArrowIcon />}
      label={label}
      size="small"
      onClick={onClick}
    />
  );
}
