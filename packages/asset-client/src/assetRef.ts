/** Crockford base32 ULID (26 chars). */
export const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

const ASSET_IRI_TAIL_RE = /\/asset\/([0-9A-HJKMNP-TV-Z]{26})(?:[\/?#]|$)/i;

export function assetIdFromString(value: string): string | undefined {
  const tail = value.match(ASSET_IRI_TAIL_RE);
  if (tail?.[1]) return tail[1];
  if (ULID_RE.test(value)) return value;
  return undefined;
}

export function assetIdFromStorageKey(storageKey: string): string | undefined {
  const base =
    storageKey
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "") ?? "";
  return ULID_RE.test(base) ? base : undefined;
}

export function isAssetRefValue(value: unknown, iriPrefix?: string): boolean {
  if (typeof value === "string") {
    if (assetIdFromString(value)) return true;
    if (iriPrefix) {
      const normalized = iriPrefix.replace(/\/?$/, "/");
      return (
        value.startsWith(`${normalized}asset/`) &&
        ULID_RE.test(value.slice(normalized.length + "asset/".length))
      );
    }
    return false;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const atId = record["@id"];
    if (typeof atId === "string" && isAssetRefValue(atId, iriPrefix)) {
      return true;
    }
    const storageKey = record.storageKey;
    if (typeof storageKey === "string" && assetIdFromStorageKey(storageKey)) {
      return true;
    }
  }
  return false;
}

export function assetIdOfValue(
  value: unknown,
  iriPrefix?: string,
): string | undefined {
  if (typeof value === "string") {
    const fromTail = assetIdFromString(value);
    if (fromTail) return fromTail;
    if (iriPrefix) {
      const normalized = iriPrefix.replace(/\/?$/, "/");
      const prefix = `${normalized}asset/`;
      if (value.startsWith(prefix)) {
        const id = value.slice(prefix.length).split(/[/?#]/)[0] ?? "";
        if (ULID_RE.test(id)) return id;
      }
    }
    return undefined;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const atId = record["@id"];
    if (typeof atId === "string") {
      return assetIdOfValue(atId, iriPrefix);
    }
    const storageKey = record.storageKey;
    if (typeof storageKey === "string") {
      return assetIdFromStorageKey(storageKey);
    }
  }
  return undefined;
}
