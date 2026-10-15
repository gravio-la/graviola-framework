/** Crockford base32 ULID (26 chars). */
export const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

const ASSET_IRI_TAIL_RE = /\/asset\/([0-9A-HJKMNP-TV-Z]{26})(?:[\/?#]|$)/i;

export type AssetRefOptions = {
  iriPrefix?: string;
  /** When set, object `storageKey` values must start with `<projectId>/`. */
  projectId?: string;
};

function ulidFromPrefixedIri(
  value: string,
  iriPrefix: string,
): string | undefined {
  const normalized = iriPrefix.replace(/\/?$/, "/");
  const prefix = `${normalized}asset/`;
  if (!value.startsWith(prefix)) return undefined;
  const id = value.slice(prefix.length).split(/[/?#]/)[0] ?? "";
  return ULID_RE.test(id) ? id.toUpperCase() : undefined;
}

export function assetIdFromString(
  value: string,
  opts?: AssetRefOptions,
): string | undefined {
  if (opts?.iriPrefix) {
    return ulidFromPrefixedIri(value, opts.iriPrefix);
  }
  const tail = value.match(ASSET_IRI_TAIL_RE);
  if (tail?.[1]) return tail[1].toUpperCase();
  if (ULID_RE.test(value)) return value.toUpperCase();
  return undefined;
}

export function assetIdFromStorageKey(
  storageKey: string,
  projectId?: string,
): string | undefined {
  if (projectId && !storageKey.startsWith(`${projectId}/`)) {
    return undefined;
  }
  const base =
    storageKey
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "") ?? "";
  return ULID_RE.test(base) ? base.toUpperCase() : undefined;
}

export function isAssetRefValue(
  value: unknown,
  opts?: AssetRefOptions | string,
): boolean {
  const options: AssetRefOptions =
    typeof opts === "string" ? { iriPrefix: opts } : (opts ?? {});

  if (typeof value === "string") {
    return assetIdFromString(value, options) != null;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const atId = record["@id"];
    if (typeof atId === "string" && isAssetRefValue(atId, options)) {
      return true;
    }
    const storageKey = record.storageKey;
    if (
      typeof storageKey === "string" &&
      assetIdFromStorageKey(storageKey, options.projectId)
    ) {
      return true;
    }
  }
  return false;
}

export function assetIdOfValue(
  value: unknown,
  opts?: AssetRefOptions | string,
): string | undefined {
  const options: AssetRefOptions =
    typeof opts === "string" ? { iriPrefix: opts } : (opts ?? {});

  if (typeof value === "string") {
    return assetIdFromString(value, options);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const atId = record["@id"];
    if (typeof atId === "string") {
      return assetIdOfValue(atId, options);
    }
    const storageKey = record.storageKey;
    if (typeof storageKey === "string") {
      return assetIdFromStorageKey(storageKey, options.projectId);
    }
  }
  return undefined;
}
