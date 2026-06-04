import { describe, expect, it } from "bun:test";

import { resolvePreviewDisplay } from "./resolvePreviewDisplay";

const ctx = {
  data: {},
  typeName: "Item",
};

describe("resolvePreviewDisplay", () => {
  it("prefers MIME icon over type icon and instance image", () => {
    const result = resolvePreviewDisplay(
      {
        label: "photo.jpg",
        image: "https://example.com/thumb.jpg",
        icon: () => null,
      },
      {
        ...ctx,
        data: { mimeType: "image/png" },
        typePresentation: {
          icon: () => null,
          iconByMime: { "image/png": "🖼️" },
        },
      },
    );
    expect(result.displayMedia).toBe("icon");
    expect(result.displayIcon).toBe("🖼️");
    expect(result.displayImage).toBeUndefined();
  });

  it("uses type icon when no MIME match (function component)", () => {
    const typeIcon = () => null;
    const result = resolvePreviewDisplay(
      { label: "X", image: "https://example.com/a.png" },
      {
        ...ctx,
        data: { mimeType: "text/plain" },
        typePresentation: {
          icon: typeIcon,
          iconByMime: { "image/*": "🖼️" },
        },
      },
    );
    expect(result.displayMedia).toBe("icon");
    expect(result.displayIcon).toBe(typeIcon);
  });

  it("uses image when no icons", () => {
    const result = resolvePreviewDisplay(
      { label: "X", image: "https://example.com/a.png" },
      { ...ctx, typePresentation: {} },
    );
    expect(result.displayMedia).toBe("image");
    expect(result.displayImage).toBe("https://example.com/a.png");
  });

  it("accepts base64 image URLs", () => {
    const b64 = "data:image/png;base64,abc";
    const result = resolvePreviewDisplay(
      { label: "X", image: b64 },
      { ...ctx, typePresentation: {} },
    );
    expect(result.displayMedia).toBe("image");
    expect(result.displayImage).toBe(b64);
  });

  it("uses image resolver from typePresentation", () => {
    const result = resolvePreviewDisplay(
      { label: "X" },
      {
        ...ctx,
        data: { id: 1 },
        typePresentation: {
          image: () => "https://resolver.example/thumb/1",
        },
      },
    );
    expect(result.displayMedia).toBe("image");
    expect(result.displayImage).toBe("https://resolver.example/thumb/1");
  });

  it("falls back to initial when no media", () => {
    const result = resolvePreviewDisplay(
      { label: "Alpha" },
      { ...ctx, typePresentation: {} },
    );
    expect(result.displayMedia).toBe("initial");
  });

  it("recognizes MUI-style forwardRef icon objects", () => {
    const muiLikeIcon = {
      $$typeof: Symbol.for("react.forward_ref"),
      type: null,
    };
    const result = resolvePreviewDisplay(
      { label: "doc.pdf" },
      {
        ...ctx,
        data: { mimeType: "application/pdf" },
        typePresentation: {
          iconByMime: { "application/pdf": muiLikeIcon },
        },
      },
    );
    expect(result.displayMedia).toBe("icon");
    expect(result.displayIcon).toBe(muiLikeIcon);
  });

  it("matches MIME wildcard major type", () => {
    const result = resolvePreviewDisplay(
      { label: "a.jpeg" },
      {
        ...ctx,
        data: { mimeType: "image/jpeg" },
        typePresentation: { iconByMime: { "image/*": "📷" } },
      },
    );
    expect(result.displayIcon).toBe("📷");
  });
});
