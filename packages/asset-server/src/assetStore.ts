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

const PRESET_WIDTH: Record<ThumbnailSizePreset, number> = {
  chip: 48,
  listItem: 96,
  card: 480,
  detail: 960,
  full: 1920,
};

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

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

type ShaIndex = Record<string, string>;

function metaKey(projectId: string, assetId: string): string {
  return `${projectId}/${assetId}.json`;
}

function binaryKey(projectId: string, assetId: string, ext: string): string {
  return `${projectId}/${assetId}.${ext}`;
}

function shaIndexKey(projectId: string): string {
  return `${projectId}/_sha256.json`;
}

async function readJsonFile<T>(
  storage: StorageAdapter,
  key: string,
): Promise<T | undefined> {
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
  const text = new TextDecoder().decode(
    chunks.length === 1
      ? chunks[0]!
      : Uint8Array.from(chunks.flatMap((c) => [...c])),
  );
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

export function assetIdFromRef(ref: string): string | undefined {
  const trimmed = ref.trim();
  if (ULID_RE.test(trimmed)) return trimmed.toUpperCase();
  const m = /\/asset\/([0-9A-HJKMNP-TV-Z]{26})\/?$/i.exec(trimmed);
  return m?.[1]?.toUpperCase();
}

export function createAssetStore(options: CreateAssetStoreOptions) {
  const { storage, picturium } = options;
  const maxBytes = options.maxBytes ?? 25 * 1024 * 1024;

  return {
    async ingest(
      projectId: string,
      input: IngestInput,
    ): Promise<UploadedAsset> {
      const bytes = await bodyToBuffer(input.body, maxBytes);
      const sniff = sniffMime(bytes, input.mediaType);
      if (!matchesAccept(sniff.encodingFormat, options.accept)) {
        throw new AssetStoreError(
          "not_accepted",
          `encoding format not accepted: ${sniff.encodingFormat}`,
        );
      }

      const hash = createHash("sha256").update(bytes).digest("hex");

      if (input.dedupe) {
        const index =
          (await readJsonFile<ShaIndex>(storage, shaIndexKey(projectId))) ?? {};
        const existingId = index[hash];
        if (existingId) {
          const existing = await this.get(projectId, existingId);
          if (existing) return existing;
        }
      }

      const assetId = ulid();
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

      const index =
        (await readJsonFile<ShaIndex>(storage, shaIndexKey(projectId))) ?? {};
      index[hash] = assetId;
      await writeJsonFile(storage, shaIndexKey(projectId), index);

      return asset;
    },

    async get(
      projectId: string,
      assetId: string,
    ): Promise<UploadedAsset | undefined> {
      return readJsonFile<UploadedAsset>(
        storage,
        metaKey(projectId, assetId.toUpperCase()),
      );
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
      const asset = await this.get(projectId, assetId);
      if (!asset) return false;
      await storage.delete(asset.storageKey);
      await storage.delete(metaKey(projectId, asset.assetId));
      const index =
        (await readJsonFile<ShaIndex>(storage, shaIndexKey(projectId))) ?? {};
      if (index[asset.sha256] === asset.assetId) {
        delete index[asset.sha256];
        await writeJsonFile(storage, shaIndexKey(projectId), index);
      }
      return true;
    },

    thumbnailUrl(
      asset: UploadedAsset,
      opts: ThumbnailUrlOptions = {},
    ): string | undefined {
      if (!picturium) return undefined;
      if (asset.encodingFormat === "image/svg+xml") return undefined;

      const dpr = Math.min(Math.max(opts.dpr ?? 1, 1), 3);
      let w = opts.w;
      if (w == null && opts.size) {
        w = PRESET_WIDTH[opts.size];
      }
      if (w == null) w = PRESET_WIDTH.card;
      w = Math.round(w * dpr);

      const params: Record<string, string> = {
        q: "80",
      };
      if (opts.h != null) params.h = String(Math.round(opts.h * dpr));
      params.w = String(w);

      if (asset.encodingFormat === "application/pdf") {
        params.thumb = "p:1";
      } else if (asset.kind === "image") {
        params.thumb = "true";
      } else {
        return undefined;
      }

      if (opts.format) params.f = opts.format;

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
