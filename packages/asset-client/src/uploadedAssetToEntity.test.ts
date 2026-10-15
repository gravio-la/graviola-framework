import { describe, expect, it } from "bun:test";
import type { UploadedAsset } from "@graviola/edb-core-types";

import { uploadedAssetToEntity } from "./uploadedAssetToEntity";

const asset: UploadedAsset = {
  assetId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  projectId: "p1",
  storageKey: "p1/01ARZ3NDEKTSV4RRFFQ69G5FAV.png",
  fileName: "photo.png",
  encodingFormat: "image/png",
  contentSize: 100,
  sha256: "abc",
  width: 10,
  height: 20,
  uploadDate: "2026-01-01T00:00:00.000Z",
  kind: "image",
};

describe("uploadedAssetToEntity", () => {
  it("includes standard fields and drops undefined caption", () => {
    const entity = uploadedAssetToEntity(asset, {
      iri: "https://example.org/asset/01ARZ3NDEKTSV4RRFFQ69G5FAV",
      typeIRI: "https://example.org/Photo",
    });
    expect(entity).toEqual({
      "@id": "https://example.org/asset/01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "@type": "https://example.org/Photo",
      storageKey: asset.storageKey,
      fileName: asset.fileName,
      encodingFormat: asset.encodingFormat,
      contentSize: asset.contentSize,
      sha256: asset.sha256,
      width: asset.width,
      height: asset.height,
      uploadDate: asset.uploadDate,
    });
  });

  it("filters to classSchema properties", () => {
    const entity = uploadedAssetToEntity(asset, {
      iri: "https://example.org/asset/x",
      typeIRI: "https://example.org/Photo",
      classSchema: {
        type: "object",
        properties: {
          "@id": { type: "string" },
          "@type": { type: "string" },
          storageKey: { type: "string" },
          width: { type: "number" },
        },
      },
      caption: "hello",
    });
    expect(entity).toEqual({
      "@id": "https://example.org/asset/x",
      "@type": "https://example.org/Photo",
      storageKey: asset.storageKey,
      width: asset.width,
    });
  });
});
