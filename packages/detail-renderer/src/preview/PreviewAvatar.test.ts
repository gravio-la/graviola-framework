import { describe, expect, it } from "bun:test";

import {
  effectivePreviewDisplayMedia,
  previewAvatarVisible,
} from "./PreviewAvatar";

describe("PreviewAvatar display precedence", () => {
  it("uses resolved displayMedia when set", () => {
    expect(
      effectivePreviewDisplayMedia({
        displayMedia: "icon",
        displayImage: "https://ignored.example/x.png",
      }),
    ).toBe("icon");
  });

  it("falls back to image then icon then initial", () => {
    expect(effectivePreviewDisplayMedia({ image: "https://x" })).toBe("image");
    expect(effectivePreviewDisplayMedia({ icon: "📁" })).toBe("icon");
    expect(effectivePreviewDisplayMedia({ label: "A" })).toBe("initial");
    expect(effectivePreviewDisplayMedia({})).toBe("none");
  });

  it("previewAvatarVisible matches non-none media", () => {
    expect(previewAvatarVisible({ displayMedia: "none" })).toBe(false);
    expect(
      previewAvatarVisible({ displayMedia: "icon", displayIcon: "x" }),
    ).toBe(true);
  });
});
