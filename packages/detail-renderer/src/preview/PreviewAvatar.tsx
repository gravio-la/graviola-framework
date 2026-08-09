import React from "react";
import { Avatar, type AvatarProps } from "@mui/material";
import type {
  EntityPreview,
  IconRef,
  PreviewDisplayMedia,
  ThumbnailResolveContext,
  ThumbnailSizeCategory,
} from "@graviola/edb-core-types";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";

/** Matches MUI `Chip` `size="small"` avatar slot (24px). */
const CHIP_AVATAR_SX: AvatarProps["sx"] = {
  width: 24,
  height: 24,
  fontSize: "0.75rem",
};

export type PreviewAvatarDensity = "chip" | "list";

function densityToCategory(
  density: PreviewAvatarDensity,
): ThumbnailSizeCategory {
  return density === "chip" ? "chip" : "listItem";
}

function initialLetter(label: string | undefined): string | undefined {
  const ch = label?.trim()?.[0];
  return ch ? ch.toUpperCase() : undefined;
}

function isRenderableIcon(icon: IconRef | undefined): icon is IconRef {
  if (icon == null) return false;
  if (typeof icon === "string") return icon.length > 0;
  if (typeof icon === "function") return true;
  if (typeof icon === "object") {
    return "$$typeof" in icon || "render" in icon || "type" in icon;
  }
  return false;
}

function renderIconContent(
  icon: IconRef,
  density: PreviewAvatarDensity,
): React.ReactNode {
  if (typeof icon === "string") return icon;
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && icon !== null)
  ) {
    const Icon = icon as React.ElementType<{
      fontSize?: number | string;
      color?: string;
      className?: string;
      style?: React.CSSProperties;
    }>;
    return <Icon style={{ fontSize: density === "chip" ? 16 : 20 }} />;
  }
  return null;
}

export function effectivePreviewDisplayMedia(
  preview: EntityPreview,
): PreviewDisplayMedia {
  if (preview.displayMedia) return preview.displayMedia;
  if (preview.displayImage ?? preview.image) return "image";
  if (preview.displayIcon ?? preview.icon) return "icon";
  if (preview.label) return "initial";
  return "none";
}

export function PreviewAvatar({
  preview,
  alt,
  density = "list",
  thumbnailContext,
}: {
  preview: EntityPreview;
  alt?: string;
  /** `chip` = 24px to fit MUI `Chip size="small"`; `list` = default Avatar for `ListItemAvatar`. */
  density?: PreviewAvatarDensity;
  thumbnailContext?: ThumbnailResolveContext;
}) {
  const media = effectivePreviewDisplayMedia(preview);
  const sizeSx = density === "chip" ? CHIP_AVATAR_SX : undefined;
  const category = densityToCategory(density);
  const rawSrc = preview.displayImage ?? preview.image;
  const src = useThumbnailUrl(
    media === "image" ? rawSrc : undefined,
    { sizeCategory: category },
    thumbnailContext,
  );

  if (media === "image") {
    if (!src) return null;
    return <Avatar alt={alt ?? preview.label} src={src} sx={sizeSx} />;
  }

  if (media === "icon") {
    const icon = preview.displayIcon ?? preview.icon;
    if (!isRenderableIcon(icon)) return null;
    return (
      <Avatar
        alt={alt ?? preview.label}
        sx={{ ...sizeSx, bgcolor: "action.selected" }}
      >
        {renderIconContent(icon, density)}
      </Avatar>
    );
  }

  if (media === "initial") {
    const letter = initialLetter(preview.label);
    if (!letter) return null;
    return (
      <Avatar alt={alt ?? preview.label} sx={sizeSx}>
        {letter}
      </Avatar>
    );
  }

  return null;
}

export function previewAvatarVisible(preview: EntityPreview): boolean {
  return effectivePreviewDisplayMedia(preview) !== "none";
}

/** Icon for MUI `Chip` `icon` prop (no circular `Avatar` wrapper). */
export function previewChipIcon(
  preview: EntityPreview,
): React.ReactNode | undefined {
  if (effectivePreviewDisplayMedia(preview) !== "icon") return undefined;
  const icon = preview.displayIcon ?? preview.icon;
  if (!isRenderableIcon(icon)) return undefined;
  return renderIconContent(icon, "chip");
}

/** `Avatar` for MUI `Chip` `avatar` prop (photos and initials only). */
export function previewChipAvatar(
  preview: EntityPreview,
  alt?: string,
  thumbnailContext?: ThumbnailResolveContext,
): React.ReactElement | undefined {
  const media = effectivePreviewDisplayMedia(preview);
  if (media !== "image" && media !== "initial") return undefined;
  return (
    <PreviewAvatar
      preview={preview}
      alt={alt}
      density="chip"
      thumbnailContext={thumbnailContext}
    />
  );
}
