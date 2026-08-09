import { applyResolveThumbnailUrl } from "@graviola/edb-core-utils";
import type {
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
  imageUrl: string | undefined,
  size?: ThumbnailSizeOptions,
  context?: ThumbnailResolveContext,
): string | undefined {
  const { resolveThumbnailUrl } = useAdbContext();

  return useMemo(() => {
    if (imageUrl == null || imageUrl === "") return undefined;
    return applyResolveThumbnailUrl(
      resolveThumbnailUrl,
      imageUrl,
      size,
      context,
    );
  }, [imageUrl, resolveThumbnailUrl, size, context]);
}
