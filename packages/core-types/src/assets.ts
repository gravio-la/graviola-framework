import type { ThumbnailSizeCategory } from "./presentation";

export type AssetKind = "image" | "file";

/** Server upload response shape (mirrors asset-server; safe for browser types). */
export interface UploadedAsset {
  assetId: string;
  projectId: string;
  storageKey: string;
  fileName?: string;
  encodingFormat: string;
  contentSize: number;
  sha256: string;
  width?: number;
  height?: number;
  sourceUrl?: string;
  uploadDate: string;
  kind: AssetKind;
  iri?: string;
}

export interface AssetCandidate {
  id: string;
  previewUrl: string;
  label?: string;
  width?: number;
  height?: number;
  origin?: string;
  import(): Promise<UploadedAsset>;
}

export type AssetCandidateProvider = (ctx: {
  entityIRI?: string;
  typeName?: string;
  data?: unknown;
}) => Promise<AssetCandidate[]>;

export type AssetThumbnailSize =
  | ThumbnailSizeCategory
  | "full"
  | { w?: number; h?: number };

export interface AssetService {
  /** Uploads allowed (project setting); reads always work. */
  enabled: boolean;
  isAssetRef(value: unknown): boolean;
  assetIdOf(value: unknown): string | undefined;
  thumbnailUrl(
    ref: unknown,
    size: AssetThumbnailSize,
    opts?: { dpr?: number },
  ): string | undefined;
  originalUrl(ref: unknown): string | undefined;
  upload(
    file: File,
    opts?: {
      caption?: string;
      signal?: AbortSignal;
      onProgress?: (fraction: number) => void;
    },
  ): Promise<UploadedAsset>;
  importFromUrl(
    url: string,
    opts?: { signal?: AbortSignal },
  ): Promise<UploadedAsset>;
  iriFor(asset: UploadedAsset): string;
  accept?: Partial<Record<AssetKind, string[]>>;
  maxBytes?: number;
  candidates?: AssetCandidateProvider;
}
