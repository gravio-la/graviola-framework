import type {
  ResolveThumbnailUrl,
  ThumbnailResolveContext,
  ThumbnailSizeCategory,
  ThumbnailSizeOptions,
} from "@graviola/edb-core-types";

/** Convenience widths for app callbacks (e.g. Commons `?width=`). Not injected into context. */
export const DEFAULT_THUMBNAIL_WIDTHS: Record<ThumbnailSizeCategory, number> = {
  chip: 48,
  listItem: 96,
  card: 480,
  detail: 960,
};

function isEmptySize(size: ThumbnailSizeOptions | undefined): boolean {
  if (size == null) return true;
  return (
    size.dimension == null && size.aspect == null && size.sizeCategory == null
  );
}

/**
 * If every field is omitted / size arg is omitted, treat as `{ sizeCategory: "detail" }`.
 */
export function normalizeThumbnailSize(
  size?: ThumbnailSizeOptions,
): ThumbnailSizeOptions {
  if (isEmptySize(size)) {
    return { sizeCategory: "detail" };
  }
  return size as ThumbnailSizeOptions;
}

/**
 * Prefer `dimension.width`, else map `sizeCategory` (after normalize) via defaults.
 */
export function thumbnailWidthHint(
  size?: ThumbnailSizeOptions,
  widths: Record<ThumbnailSizeCategory, number> = DEFAULT_THUMBNAIL_WIDTHS,
): number {
  const normalized = normalizeThumbnailSize(size);
  const fromDimension = normalized.dimension?.width;
  if (typeof fromDimension === "number" && fromDimension > 0) {
    return fromDimension;
  }
  const category = normalized.sizeCategory ?? "detail";
  return widths[category] ?? widths.detail;
}

/**
 * Apply an optional {@link ResolveThumbnailUrl}; fall back to the original URL.
 */
export function applyResolveThumbnailUrl(
  fn: ResolveThumbnailUrl | undefined,
  imageUrl: string,
  size?: ThumbnailSizeOptions,
  context?: ThumbnailResolveContext,
): string {
  if (!fn || !imageUrl) return imageUrl;
  const normalized = normalizeThumbnailSize(size);
  const rewritten = fn(imageUrl, normalized, context);
  if (typeof rewritten === "string" && rewritten.length > 0) {
    return rewritten;
  }
  return imageUrl;
}
