import { AssetStoreError } from "./errors.js";

/** Keys must look like `<projectId>/<assetId>.<ext>` — no traversal or absolute paths. */
export function assertValidStorageKey(key: string): void {
  if (!key || key.includes("\\")) {
    throw new AssetStoreError("invalid_key", `invalid storage key: ${key}`);
  }
  if (key.startsWith("/") || /^[a-zA-Z]:/.test(key)) {
    throw new AssetStoreError(
      "invalid_key",
      `absolute storage key rejected: ${key}`,
    );
  }
  if (key.includes("..")) {
    throw new AssetStoreError(
      "invalid_key",
      `path traversal in storage key: ${key}`,
    );
  }
  const segments = key.split("/");
  if (segments.length < 2 || segments.some((s) => s === "")) {
    throw new AssetStoreError("invalid_key", `malformed storage key: ${key}`);
  }
}
