import { describe, expect, it } from "bun:test";

import {
  applyResolveThumbnailUrl,
  DEFAULT_THUMBNAIL_WIDTHS,
  normalizeThumbnailSize,
  thumbnailWidthHint,
} from "./resolveThumbnailUrl";

describe("normalizeThumbnailSize", () => {
  it("defaults empty/undefined to detail", () => {
    expect(normalizeThumbnailSize()).toEqual({ sizeCategory: "detail" });
    expect(normalizeThumbnailSize({})).toEqual({ sizeCategory: "detail" });
  });

  it("keeps provided sizeCategory", () => {
    expect(normalizeThumbnailSize({ sizeCategory: "chip" })).toEqual({
      sizeCategory: "chip",
    });
  });

  it("keeps dimension-only size", () => {
    expect(normalizeThumbnailSize({ dimension: { width: 120 } })).toEqual({
      dimension: { width: 120 },
    });
  });
});

describe("thumbnailWidthHint", () => {
  it("uses dimension.width when set", () => {
    expect(thumbnailWidthHint({ dimension: { width: 42 } })).toBe(42);
  });

  it("maps sizeCategory via defaults", () => {
    expect(thumbnailWidthHint({ sizeCategory: "chip" })).toBe(
      DEFAULT_THUMBNAIL_WIDTHS.chip,
    );
    expect(thumbnailWidthHint({ sizeCategory: "listItem" })).toBe(
      DEFAULT_THUMBNAIL_WIDTHS.listItem,
    );
    expect(thumbnailWidthHint()).toBe(DEFAULT_THUMBNAIL_WIDTHS.detail);
  });
});

describe("applyResolveThumbnailUrl", () => {
  const original = "https://example.com/full.jpg";

  it("returns original when fn is missing", () => {
    expect(
      applyResolveThumbnailUrl(undefined, original, { sizeCategory: "chip" }),
    ).toBe(original);
  });

  it("returns original when fn returns undefined", () => {
    expect(
      applyResolveThumbnailUrl(() => undefined, original, {
        sizeCategory: "chip",
      }),
    ).toBe(original);
  });

  it("returns rewritten URL and normalizes empty size to detail", () => {
    const seen: unknown[] = [];
    const result = applyResolveThumbnailUrl((url, size) => {
      seen.push({ url, size });
      return `${url}?w=1`;
    }, original);
    expect(result).toBe(`${original}?w=1`);
    expect(seen[0]).toEqual({
      url: original,
      size: { sizeCategory: "detail" },
    });
  });

  it("passes through sizeCategory and context", () => {
    let gotSize: unknown;
    let gotCtx: unknown;
    applyResolveThumbnailUrl(
      (_url, size, ctx) => {
        gotSize = size;
        gotCtx = ctx;
        return "https://cdn.example/t.jpg";
      },
      original,
      { sizeCategory: "chip" },
      { typeName: "City", viewSize: "chip" },
    );
    expect(gotSize).toEqual({ sizeCategory: "chip" });
    expect(gotCtx).toEqual({ typeName: "City", viewSize: "chip" });
  });
});
