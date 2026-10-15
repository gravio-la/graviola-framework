import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";

import { createAssetStore } from "./assetStore.js";
import { FsStorageAdapter } from "./fsStorageAdapter.js";
import { AssetStoreError } from "./errors.js";
import { tinyJpeg, tinyPng, minimalPdf } from "./testFixtures.js";

describe("createAssetStore", () => {
  test("ingest jpeg/png/pdf and dedupe by sha256", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "asset-store-"));
    try {
      const storage = FsStorageAdapter({ rootDir: root });
      const store = createAssetStore({
        storage,
        maxBytes: 1024 * 1024,
        picturium: {
          baseUrl: "http://localhost:9",
          key: "secret",
          dataDir: root,
        },
      });

      const png = await store.ingest("proj", {
        body: tinyPng(),
        fileName: "a.png",
      });
      expect(png.kind).toBe("image");
      expect(png.encodingFormat).toBe("image/png");
      expect(png.width).toBe(1);
      expect(png.height).toBe(1);

      const jpeg = await store.ingest("proj", {
        body: tinyJpeg(),
        fileName: "b.jpg",
      });
      expect(jpeg.encodingFormat).toBe("image/jpeg");

      const pdf = await store.ingest("proj", {
        body: minimalPdf(),
        fileName: "c.pdf",
      });
      expect(pdf.kind).toBe("file");
      expect(pdf.encodingFormat).toBe("application/pdf");

      const dup = await store.ingest("proj", {
        body: tinyPng(),
        dedupe: true,
      });
      expect(dup.assetId).toBe(png.assetId);

      const loaded = await store.get("proj", png.assetId);
      expect(loaded?.storageKey).toBe(png.storageKey);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("rejects path traversal keys via storage adapter", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "asset-store-"));
    try {
      const storage = FsStorageAdapter({ rootDir: root });
      await expect(
        storage.put("../escape.bin", new Uint8Array([1])),
      ).rejects.toBeInstanceOf(AssetStoreError);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
