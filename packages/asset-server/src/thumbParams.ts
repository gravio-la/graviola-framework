import type { ThumbnailSizePreset } from "./types.js";

const SIZE_PRESETS = new Set<ThumbnailSizePreset>([
  "chip",
  "listItem",
  "card",
  "detail",
  "full",
]);

export interface ParsedThumbParams {
  size?: ThumbnailSizePreset;
  w?: number;
  h?: number;
  dpr: number;
}

export function parseThumbQuery(
  query: Record<string, string>,
): ParsedThumbParams {
  const sizeRaw = query.size;
  let size: ThumbnailSizePreset | undefined;
  if (sizeRaw != null && sizeRaw !== "") {
    if (!SIZE_PRESETS.has(sizeRaw as ThumbnailSizePreset)) {
      throw new Error(`invalid thumb size: ${sizeRaw}`);
    }
    size = sizeRaw as ThumbnailSizePreset;
  }

  const wRaw = query.w;
  const hRaw = query.h;
  let w: number | undefined;
  let h: number | undefined;
  if (wRaw != null && wRaw !== "") {
    w = Number(wRaw);
    if (!Number.isInteger(w) || w < 1 || w > 4096) {
      throw new Error(`invalid thumb w: ${wRaw}`);
    }
  }
  if (hRaw != null && hRaw !== "") {
    h = Number(hRaw);
    if (!Number.isInteger(h) || h < 1 || h > 4096) {
      throw new Error(`invalid thumb h: ${hRaw}`);
    }
  }

  const dprRaw = query.dpr;
  let dpr = 1;
  if (dprRaw != null && dprRaw !== "") {
    const n = Number(dprRaw);
    const rounded = Math.round(n);
    if (![1, 2, 3].includes(rounded)) {
      throw new Error(`invalid thumb dpr: ${dprRaw}`);
    }
    dpr = rounded;
  }

  return { size, w, h, dpr };
}
