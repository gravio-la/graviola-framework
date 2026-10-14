import { describe, expect, it } from "bun:test";
import { selectEntry } from "@graviola/edb-detail-renderer-core";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";

import { arrayOfImageUrisTester } from "./arrayOfImagesTester";
import { ImageGalleryRenderer } from "./ImageGalleryRenderer";
import { ArrayPrimitiveRenderer } from "./ArrayPrimitiveRenderer";

describe("arrayOfImageUrisTester", () => {
  const ctx: DetailTesterContext = {
    rootSchema: {},
    depth: 0,
    maxDepth: 6,
  };

  const gallerySchema = {
    type: "array" as const,
    items: {
      type: "string" as const,
      format: "uri" as const,
      contentMediaType: "image/jpeg",
    },
  };

  it("ranks above arrayPrimitiveTester", () => {
    expect(
      arrayOfImageUrisTester({ type: "Control", scope: "#" }, gallerySchema, {
        rootSchema: {},
        config: { rootSchema: {} },
      }),
    ).toBe(4);
  });

  it("selectEntry picks ImageGalleryRenderer over ArrayPrimitiveRenderer", async () => {
    const { defaultDetailRenderers } = await import("./registries");
    const ui = { type: "Control", scope: "#/properties/photos" };
    const entry = selectEntry(defaultDetailRenderers, ui, gallerySchema, ctx);
    expect(entry?.renderer).toBe(ImageGalleryRenderer);
    expect(entry?.renderer).not.toBe(ArrayPrimitiveRenderer);
  });
});
