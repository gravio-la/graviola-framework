import { createHmac } from "node:crypto";
import path from "node:path";

/** Percent-encode like Rust `NON_ALPHANUMERIC` (alphanumeric only stays unencoded). */
export function percentEncodeNonAlphanumeric(input: string): string {
  const out: string[] = [];
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    const isAlpha =
      (code >= 48 && code <= 57) ||
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122);
    if (isAlpha) {
      out.push(ch);
      continue;
    }
    for (const byte of new TextEncoder().encode(ch)) {
      out.push(`%${byte.toString(16).toUpperCase().padStart(2, "0")}`);
    }
  }
  return out.join("");
}

function encodePathSegments(rawPath: string): string {
  return rawPath
    .split("/")
    .map((seg) => (seg === "" ? "" : percentEncodeNonAlphanumeric(seg)))
    .join("/");
}

export function rawPathForSign(
  absoluteFilePath: string,
  dataDir: string,
): string {
  const abs = path.normalize(absoluteFilePath);
  const data = path.normalize(dataDir);
  if (data === path.sep || data === "/") {
    return abs.replace(/^\/+/, "");
  }
  const rel = path.relative(data, abs);
  if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
    return rel.split(path.sep).join("/");
  }
  return abs;
}

export function signPicturiumToken(
  rawPath: string,
  params: Record<string, string>,
  key: string,
): string {
  const sorted = Object.entries(params)
    .filter(([k]) => k !== "token")
    .sort(([a], [b]) => a.localeCompare(b));
  const data = sorted.map(([k, v]) => `${k}=${v}`).join("&");
  const payload = `${rawPath}?${data}`;
  return createHmac("sha256", key).update(payload, "utf8").digest("hex");
}

export function buildPicturiumUrl(options: {
  baseUrl: string;
  absoluteFilePath: string;
  dataDir: string;
  key?: string;
  params?: Record<string, string>;
}): string {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const rawPath = rawPathForSign(options.absoluteFilePath, options.dataDir);
  const urlPath = encodePathSegments(rawPath);
  const params: Record<string, string> = { ...(options.params ?? {}) };
  if (options.key) {
    params.token = signPicturiumToken(rawPath, params, options.key);
  }
  const qs = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([k, v]) =>
        `${percentEncodeNonAlphanumeric(k)}=${percentEncodeNonAlphanumeric(v)}`,
    )
    .join("&");
  return qs ? `${baseUrl}/${urlPath}?${qs}` : `${baseUrl}/${urlPath}`;
}
