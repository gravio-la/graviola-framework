const CHUNK_SIZE = 0x8000;

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function normalizeBase64Input(encoded: string): string {
  const standard = encoded
    .replace(/ /g, "+")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padLength = (4 - (standard.length % 4)) % 4;
  return standard + "=".repeat(padLength);
}

/**
 * Encodes an IRI as base64url of its UTF-8 bytes (no padding), safe for URL path
 * segments and query strings. Uses Buffer in Node/Bun and btoa in browsers.
 */
export const encodeIRI = (iri: string): string => {
  const bytes = new TextEncoder().encode(iri);
  return toBase64Url(bytesToBase64(bytes));
};

/**
 * Decodes a base64url-encoded IRI back to the original string. Also accepts legacy
 * standard base64 (with or without padding), including values where query-string
 * parsing turned `+` into a space.
 */
export const decodeIRI = (encoded: string): string => {
  const bytes = base64ToBytes(normalizeBase64Input(encoded));
  return new TextDecoder().decode(bytes);
};
