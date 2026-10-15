import type {
  AssetService,
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
  full: 1920,
};

function assetThumbnailSizeFromOptions(
  size: ThumbnailSizeOptions,
): Parameters<AssetService["thumbnailUrl"]>[1] {
  const w = size.dimension?.width;
  const h = size.dimension?.height;
  if (typeof w === "number" || typeof h === "number") {
    return { w, h };
  }
  return size.sizeCategory ?? "detail";
}

function resolveDevicePixelRatio(dpr?: number): number | undefined {
  if (typeof dpr === "number" && dpr > 0) {
    return Math.min(3, Math.max(1, Math.round(dpr)));
  }
  const raw =
    typeof globalThis !== "undefined" &&
    "devicePixelRatio" in globalThis &&
    typeof globalThis.devicePixelRatio === "number"
      ? globalThis.devicePixelRatio
      : 1;
  const rounded = Math.min(3, Math.max(1, Math.round(raw)));
  return rounded === 1 ? undefined : rounded;
}

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
 * Apply optional {@link AssetService} thumb URLs, then an optional
 * {@link ResolveThumbnailUrl}; fall back to the original URL string.
 */
export function applyResolveThumbnailUrl(
  fn: ResolveThumbnailUrl | undefined,
  imageRef: unknown,
  size?: ThumbnailSizeOptions,
  context?: ThumbnailResolveContext,
  assetService?: AssetService,
): string {
  if (imageRef == null || imageRef === "") return "";

  if (assetService?.isAssetRef(imageRef)) {
    const normalized = normalizeThumbnailSize(size);
    const dpr = resolveDevicePixelRatio();
    const thumb = assetService.thumbnailUrl(
      imageRef,
      assetThumbnailSizeFromOptions(normalized),
      dpr != null ? { dpr } : undefined,
    );
    if (typeof thumb === "string" && thumb.length > 0) {
      return thumb;
    }
  }

  const imageUrl = typeof imageRef === "string" ? imageRef : "";
  if (!imageUrl) return "";

  if (!fn) return imageUrl;
  const normalized = normalizeThumbnailSize(size);
  const rewritten = fn(imageUrl, normalized, context);
  if (typeof rewritten === "string" && rewritten.length > 0) {
    return rewritten;
  }
  return imageUrl;
}
