import { createHash } from "node:crypto";
import { Readable } from "node:stream";

import { ulid } from "ulid";

import { AssetStoreError } from "./errors.js";
import { readImageDimensions } from "./imageDimensions.js";
import { sniffMime } from "./mimeSniff.js";
import { buildPicturiumUrl } from "./picturiumSigner.js";
import type { StorageAdapter, PutBody } from "./storageAdapter.js";
import type {
  ThumbnailSizePreset,
  ThumbnailUrlOptions,
  UploadedAsset,
} from "./types.js";
import {
  assertValidProjectId,
  assetIdFromRef,
  normalizeAssetId,
} from "./validateIds.js";

const PRESET_WIDTH: Record<ThumbnailSizePreset, number> = {
  chip: 48,
  listItem: 96,
  card: 480,
  detail: 960,
  full: 1920,
};

export interface PicturiumConfig {
  baseUrl: string;
  key: string;
  dataDir: string;
}

export interface CreateAssetStoreOptions {
  storage: StorageAdapter;
  picturium?: PicturiumConfig;
  maxBytes?: number;
  accept?: string[];
}

export interface IngestInput {
  body: PutBody;
  fileName?: string;
  mediaType?: string;
  sourceUrl?: string;
  dedupe?: boolean;
}

function metaKey(projectId: string, assetId: string): string {
  return `${projectId}/${assetId}.json`;
}

function binaryKey(projectId: string, assetId: string, ext: string): string {
  return `${projectId}/${assetId}.${ext}`;
}

function shaMarkerKey(projectId: string, sha256: string): string {
  return `${projectId}/_sha/${sha256}`;
}

async function readTextFile(
  storage: StorageAdapter,
  key: string,
): Promise<string | undefined> {
  const st = await storage.stat(key);
  if (!st) return undefined;
  const stream = await storage.getStream(key);
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return new TextDecoder().decode(
    chunks.length === 1
      ? chunks[0]!
      : Uint8Array.from(chunks.flatMap((c) => [...c])),
  );
}

async function readJsonFile<T>(
  storage: StorageAdapter,
  key: string,
): Promise<T | undefined> {
  const text = await readTextFile(storage, key);
  if (text == null) return undefined;
  return JSON.parse(text) as T;
}

async function writeJsonFile(
  storage: StorageAdapter,
  key: string,
  value: unknown,
): Promise<void> {
  const bytes = new TextEncoder().encode(JSON.stringify(value, null, 2));
  await storage.put(key, bytes);
}

async function waitForAssetByMarker(
  store: { get: (p: string, id: string) => Promise<UploadedAsset | undefined> },
  projectId: string,
  markerKey: string,
  storage: StorageAdapter,
  opts?: { requireMarker?: boolean },
): Promise<UploadedAsset | undefined> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const winner = await readTextFile(storage, markerKey);
    if (!winner) {
      if (opts?.requireMarker) {
        await new Promise((r) => setTimeout(r, 5));
        continue;
      }
      return undefined;
    }
    const existing = await store.get(projectId, winner.trim());
    if (existing) return existing;
    await new Promise((r) => setTimeout(r, 5));
  }
  return undefined;
}

async function bodyToBuffer(
  body: PutBody,
  maxBytes: number,
): Promise<Uint8Array> {
  if (body instanceof Uint8Array) {
    if (body.byteLength > maxBytes) {
      throw new AssetStoreError(
        "too_large",
        `body exceeds maxBytes ${maxBytes}`,
      );
    }
    return body;
  }
  if (body instanceof Blob) {
    if (body.size > maxBytes) {
      throw new AssetStoreError(
        "too_large",
        `body exceeds maxBytes ${maxBytes}`,
      );
    }
    return new Uint8Array(await body.arrayBuffer());
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    size += value.byteLength;
    if (size > maxBytes) {
      throw new AssetStoreError(
        "too_large",
        `body exceeds maxBytes ${maxBytes}`,
      );
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

function matchesAccept(encodingFormat: string, accept?: string[]): boolean {
  if (!accept?.length) return true;
  return accept.some((pattern) => {
    const p = pattern.toLowerCase();
    const ct = encodingFormat.toLowerCase();
    if (p.endsWith("/*")) return ct.startsWith(p.slice(0, -1));
    return ct === p;
  });
}

export { assetIdFromRef };

export function createAssetStore(options: CreateAssetStoreOptions) {
  const { storage, picturium } = options;
  const maxBytes = options.maxBytes ?? 25 * 1024 * 1024;

  const resolveAssetId = async (
    projectId: string,
    assetId: string,
  ): Promise<string> => {
    assertValidProjectId(projectId);
    return normalizeAssetId(assetId);
  };

  return {
    async ingest(
      projectId: string,
      input: IngestInput,
    ): Promise<UploadedAsset> {
      assertValidProjectId(projectId);
      const bytes = await bodyToBuffer(input.body, maxBytes);
      const sniff = sniffMime(bytes, input.mediaType, input.fileName);
      if (!matchesAccept(sniff.encodingFormat, options.accept)) {
        throw new AssetStoreError(
          "not_accepted",
          `encoding format not accepted: ${sniff.encodingFormat}`,
        );
      }

      const hash = createHash("sha256").update(bytes).digest("hex");
      const dedupe = input.dedupe !== false;

      if (dedupe) {
        const marker = shaMarkerKey(projectId, hash);
        const raced = await waitForAssetByMarker(
          this,
          projectId,
          marker,
          storage,
        );
        if (raced) return raced;
      }

      const assetId = ulid();

      if (dedupe) {
        const marker = shaMarkerKey(projectId, hash);
        const created = await storage.putExclusive(
          marker,
          new TextEncoder().encode(assetId),
        );
        if (!created) {
          const existing = await waitForAssetByMarker(
            this,
            projectId,
            marker,
            storage,
            { requireMarker: true },
          );
          if (existing) return existing;
          throw new AssetStoreError(
            "not_found",
            "dedupe marker present but asset missing",
          );
        }
      }

      const storageKey = binaryKey(projectId, assetId, sniff.ext);
      await storage.put(storageKey, bytes);

      const dims = readImageDimensions(bytes, sniff.encodingFormat);
      const asset: UploadedAsset = {
        assetId,
        projectId,
        storageKey,
        fileName: input.fileName ?? `${assetId}.${sniff.ext}`,
        encodingFormat: sniff.encodingFormat,
        contentSize: bytes.length,
        sha256: hash,
        width: dims?.width,
        height: dims?.height,
        sourceUrl: input.sourceUrl,
        uploadDate: new Date().toISOString(),
        kind: sniff.kind,
      };

      await writeJsonFile(storage, metaKey(projectId, assetId), asset);

      return asset;
    },

    async get(
      projectId: string,
      assetId: string,
    ): Promise<UploadedAsset | undefined> {
      assertValidProjectId(projectId);
      const id = await resolveAssetId(projectId, assetId);
      return readJsonFile<UploadedAsset>(storage, metaKey(projectId, id));
    },

    async openOriginal(
      projectId: string,
      assetId: string,
    ): Promise<
      { asset: UploadedAsset; stream: ReadableStream<Uint8Array> } | undefined
    > {
      const asset = await this.get(projectId, assetId);
      if (!asset) return undefined;
      const stream = await storage.getStream(asset.storageKey);
      return { asset, stream };
    },

    async delete(projectId: string, assetId: string): Promise<boolean> {
      assertValidProjectId(projectId);
      const id = await resolveAssetId(projectId, assetId);
      const asset = await this.get(projectId, id);
      if (!asset) return false;
      await storage.delete(asset.storageKey);
      await storage.delete(metaKey(projectId, asset.assetId));
      await storage.delete(shaMarkerKey(projectId, asset.sha256));
      return true;
    },

    thumbnailUrl(
      asset: UploadedAsset,
      opts: ThumbnailUrlOptions = {},
    ): string | undefined {
      if (!picturium) return undefined;
      if (asset.encodingFormat === "image/svg+xml") return undefined;

      const dprRaw = opts.dpr ?? 1;
      const dpr = [1, 2, 3].includes(Math.round(dprRaw))
        ? Math.round(dprRaw)
        : 1;

      const params: Record<string, string> = {
        q: "80",
      };

      let w = opts.w;
      if (w == null && opts.size) {
        w = PRESET_WIDTH[opts.size];
      }
      if (w != null) {
        params.w = String(Math.round(w * dpr));
      }
      if (opts.h != null) {
        params.h = String(Math.round(opts.h * dpr));
      }
      if (params.w == null && params.h == null) {
        params.w = String(Math.round(PRESET_WIDTH.card * dpr));
      }

      if (asset.encodingFormat === "application/pdf") {
        params.thumb = "p:1";
      } else if (asset.kind === "image") {
        params.thumb = "true";
      } else {
        return undefined;
      }

      const abs = storage.absolutePath(asset.storageKey);
      return buildPicturiumUrl({
        baseUrl: picturium.baseUrl,
        absoluteFilePath: abs,
        dataDir: picturium.dataDir,
        key: picturium.key,
        params,
      });
    },
  };
}

export type AssetStore = ReturnType<typeof createAssetStore>;

/** Stream helper for Node consumers */
export function uint8ArrayToNodeReadable(
  bytes: Uint8Array,
): NodeJS.ReadableStream {
  return Readable.from(bytes);
}
