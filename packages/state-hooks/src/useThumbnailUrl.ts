import { applyResolveThumbnailUrl } from "@graviola/edb-core-utils";
import type {
  PreviewImageRef,
  ResolveThumbnailUrl,
  ThumbnailResolveContext,
  ThumbnailSizeOptions,
} from "@graviola/edb-core-types";
import { useMemo } from "react";

import { useAdbContext, type AdbContextValue } from "./provider/adbContext";

/**
 * Bound helper for non-hook call sites that already hold Adb context.
 */
export function getResolveThumbnailUrl(
  adb: Pick<AdbContextValue<unknown>, "resolveThumbnailUrl">,
): ResolveThumbnailUrl | undefined {
  return adb.resolveThumbnailUrl;
}

/**
 * Resolve a display image URL via optional `AdbProvider.resolveThumbnailUrl`.
 * Empty/omitted size defaults to `{ sizeCategory: "detail" }`.
 */
export function useThumbnailUrl(
  imageRef: PreviewImageRef | undefined,
  size?: ThumbnailSizeOptions,
  context?: ThumbnailResolveContext,
): string | undefined {
  const { resolveThumbnailUrl, assetService } = useAdbContext();

  return useMemo(() => {
    if (imageRef == null || imageRef === "") return undefined;
    const resolved = applyResolveThumbnailUrl(
      resolveThumbnailUrl,
      imageRef,
      size,
      context,
      assetService,
    );
    return resolved.length > 0 ? resolved : undefined;
  }, [imageRef, resolveThumbnailUrl, assetService, size, context]);
}
