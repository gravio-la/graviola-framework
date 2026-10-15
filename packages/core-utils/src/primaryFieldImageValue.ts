import type { PreviewImageRef } from "@graviola/edb-core-types";

/**
 * Normalize a primary-field image value: strings pass through, arrays use the
 * first element, objects prefer `@id` else return the object when it carries
 * `storageKey` (for asset service refs).
 */
export function primaryFieldImageValue(
  value: unknown,
): PreviewImageRef | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    return value.length > 0 ? value : undefined;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    return primaryFieldImageValue(value[0]);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const atId = record["@id"];
    if (typeof atId === "string" && atId.length > 0) {
      return atId;
    }
    if (typeof record.storageKey === "string" && record.storageKey.length > 0) {
      return record;
    }
  }
  return undefined;
}
