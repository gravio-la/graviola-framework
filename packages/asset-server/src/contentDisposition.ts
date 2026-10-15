const CONTROL_OR_QUOTE = /[\u0000-\u001f\u007f"\\]/g;

function asciiFallback(fileName: string): string {
  const stripped = fileName.replace(CONTROL_OR_QUOTE, "_");
  const ascii = stripped.replace(/[^\x20-\x7e]/g, "_");
  return ascii.length > 0 ? ascii : "download";
}

function encodeRFC5987(fileName: string): string {
  return encodeURIComponent(fileName)
    .replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%(7C|60|5E)/g, (m) => m.toLowerCase());
}

export function contentDispositionHeader(
  fileName: string,
  inline: boolean,
): string {
  const disposition = inline ? "inline" : "attachment";
  const fallback = asciiFallback(fileName);
  const encoded = encodeRFC5987(fileName.replace(CONTROL_OR_QUOTE, ""));
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export function isInlineOriginalMime(encodingFormat: string): boolean {
  const mime = encodingFormat.toLowerCase().split(";")[0]?.trim() ?? "";
  if (mime === "application/pdf") return true;
  if (mime === "image/svg+xml") return false;
  if (mime.startsWith("image/")) {
    return mime !== "image/svg+xml";
  }
  return false;
}

export const SECURE_CONTENT_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; sandbox",
};
