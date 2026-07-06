import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import type { CardActionRendererProps } from "@graviola/edb-detail-renderer-core";

import { sameAudioUrl } from "./playableAudioUtils";

function audioUrlFromAction(
  action: CardActionRendererProps["action"],
  data: unknown,
): string | null {
  const prefix = "play:";
  if (!action.id.startsWith(prefix)) return null;
  const propertyName = action.id.slice(prefix.length);
  if (!propertyName || !data || typeof data !== "object") return null;
  const value = (data as Record<string, unknown>)[propertyName];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Play/pause toggle for schema properties with `contentMediaType: audio/*`.
 * Owns its HTMLAudioElement — no state leaks outside the renderer.
 */
export function PlayableAudioActionRenderer({
  action,
  data,
}: CardActionRendererProps) {
  const url = audioUrlFromAction(action, data);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.src = "";
      }
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !url) return;
    if (!sameAudioUrl(el.src, url)) {
      el.pause();
      el.src = url;
      setIsPlaying(false);
    }
  }, [url]);

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!url) return;

      let el = audioRef.current;
      if (!el) {
        el = new Audio(url);
        audioRef.current = el;
        el.addEventListener("ended", () => setIsPlaying(false));
        el.addEventListener("pause", () => setIsPlaying(false));
        el.addEventListener("play", () => setIsPlaying(true));
      } else if (!sameAudioUrl(el.src, url)) {
        el.pause();
        el.src = url;
      }

      if (!el.paused) {
        el.pause();
        setIsPlaying(false);
        return;
      }

      void el
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    },
    [url],
  );

  if (!url) return null;

  return (
    <Button
      size="small"
      variant={action.primary ? "contained" : "text"}
      color={action.primary ? "primary" : "inherit"}
      onClick={toggle}
      startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      sx={{
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 600,
        ...(action.primary ? { px: 2.5 } : { color: "text.secondary" }),
      }}
    >
      {isPlaying ? "Pause" : action.label}
    </Button>
  );
}
