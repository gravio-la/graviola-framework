import { AssetStoreError } from "./errors.js";

export const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

export function assetIdFromRef(ref: string): string | undefined {
  const trimmed = ref.trim();
  if (ULID_RE.test(trimmed)) return trimmed.toUpperCase();
  const m = /\/asset\/([0-9A-HJKMNP-TV-Z]{26})\/?$/i.exec(trimmed);
  return m?.[1]?.toUpperCase();
}
const PROJECT_ID_RE = /^[A-Za-z0-9._-]+$/;

export function normalizeAssetId(assetId: string): string {
  const fromRef = assetIdFromRef(assetId);
  const id = fromRef ?? assetId;
  if (!ULID_RE.test(id)) {
    throw new AssetStoreError("invalid_id", `invalid asset id: ${assetId}`);
  }
  return id.toUpperCase();
}

export function assertValidProjectId(projectId: string): void {
  if (
    !projectId ||
    !PROJECT_ID_RE.test(projectId) ||
    projectId.includes("..")
  ) {
    throw new AssetStoreError("invalid_id", `invalid project id: ${projectId}`);
  }
}
