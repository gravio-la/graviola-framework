export interface UploadedAsset {
  assetId: string;
  projectId: string;
  storageKey: string;
  fileName: string;
  encodingFormat: string;
  contentSize: number;
  sha256: string;
  width?: number;
  height?: number;
  sourceUrl?: string;
  uploadDate: string;
  kind: "image" | "file";
}

export type ThumbnailSizePreset =
  | "chip"
  | "listItem"
  | "card"
  | "detail"
  | "full";

export interface ThumbnailUrlOptions {
  size?: ThumbnailSizePreset;
  w?: number;
  h?: number;
  dpr?: number;
  format?: "webp" | "avif" | "jpg" | "png";
}
