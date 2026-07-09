import type { JSONSchema7 } from "json-schema";
import { convertDefsToDefinitions } from "./defsToDefinitions";

/** Fields excluded from fingerprint input (advisory / document identity, not semantic shape). */
const FINGERPRINT_EXCLUDE = new Set(["version", "$schema"]);

export type SchemaIdentity = {
  /** Schema document IRI from `$id`, if present. */
  schema?: string;
  /** Declared human-readable version (top-level `version` keyword). Advisory only. */
  version?: string;
  /** Content-derived machine identity: `sha256-<hex>`. */
  fingerprint: string;
};

/**
 * Canonicalization contract for {@link schemaFingerprint}:
 *
 * 1. Normalize `$defs` → `definitions` (Graviola convention).
 * 2. Recursively sort object keys lexicographically at every level.
 * 3. Preserve array element order (required, enum, allOf order are semantic).
 * 4. Exclude top-level `version` and `$schema` from the hashed payload.
 * 5. `$ref` strings are normalized only indirectly via defs→definitions rename;
 *    callers should use consistent ref targets before fingerprinting.
 *
 * The fingerprint is stable across property order permutations on the same schema.
 */
export function canonicalizeSchemaForFingerprint(
  schema: JSONSchema7,
): JSONSchema7 {
  const normalized = convertDefsToDefinitions(
    structuredClone(schema) as JSONSchema7,
  ) as JSONSchema7;
  return sortKeysDeep(normalized, FINGERPRINT_EXCLUDE) as JSONSchema7;
}

/**
 * Stable content fingerprint for a JSON Schema document.
 * Returns `sha256-<hex>` using Web Crypto (Bun + browser compatible).
 */
export async function schemaFingerprint(schema: JSONSchema7): Promise<string> {
  const canonical = canonicalizeSchemaForFingerprint(schema);
  const json = JSON.stringify(canonical);
  const digest = await sha256Hex(json);
  return `sha256-${digest}`;
}

/** Synchronous fingerprint when a sync hash is required (uses Bun's crypto). */
export function schemaFingerprintSync(schema: JSONSchema7): string {
  const canonical = canonicalizeSchemaForFingerprint(schema);
  const json = JSON.stringify(canonical);
  if (typeof globalThis.Bun !== "undefined") {
    const hasher = new globalThis.Bun.CryptoHasher("sha256");
    hasher.update(json);
    return `sha256-${hasher.digest("hex")}`;
  }
  throw new Error(
    "schemaFingerprintSync requires Bun; use schemaFingerprint() in browser",
  );
}

/**
 * Extract schema identity: `$id`, optional declared `version`, and content fingerprint.
 * Version never participates in drift checks — only {@link SchemaIdentity.fingerprint} is authoritative.
 */
export async function schemaIdentityOf(
  schema: JSONSchema7,
): Promise<SchemaIdentity> {
  const fingerprint = await schemaFingerprint(schema);
  const version =
    typeof schema.version === "string" ? schema.version : undefined;
  const id = typeof schema.$id === "string" ? schema.$id : undefined;
  return { schema: id, version, fingerprint };
}

export function schemaIdentityOfSync(schema: JSONSchema7): SchemaIdentity {
  const fingerprint = schemaFingerprintSync(schema);
  const version =
    typeof schema.version === "string" ? schema.version : undefined;
  const id = typeof schema.$id === "string" ? schema.$id : undefined;
  return { schema: id, version, fingerprint };
}

/**
 * Warn when declared version is unchanged but content fingerprint differs
 * (author may have forgotten to bump version).
 */
export function versionFingerprintDriftWarning(
  previous: Pick<SchemaIdentity, "version" | "fingerprint">,
  current: Pick<SchemaIdentity, "version" | "fingerprint">,
): string | undefined {
  if (
    previous.version &&
    current.version &&
    previous.version === current.version &&
    previous.fingerprint !== current.fingerprint
  ) {
    return `Schema version "${current.version}" unchanged but content fingerprint changed (${previous.fingerprint} → ${current.fingerprint}) — bump the version?`;
  }
  return undefined;
}

function sortKeysDeep(value: unknown, excludeKeys: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item, excludeKeys));
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      if (excludeKeys.has(key)) continue;
      sorted[key] = sortKeysDeep(obj[key], excludeKeys);
    }
    return sorted;
  }
  return value;
}

async function sha256Hex(text: string): Promise<string> {
  if (typeof globalThis.Bun !== "undefined") {
    const hasher = new globalThis.Bun.CryptoHasher("sha256");
    hasher.update(text);
    return hasher.digest("hex");
  }
  const data = new TextEncoder().encode(text);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
