export interface SniffResult {
  encodingFormat: string;
  ext: string;
  kind: "image" | "file";
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

function isFtypAvifOrHeic(bytes: Uint8Array): SniffResult | undefined {
  if (bytes.length < 12) return undefined;
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand.startsWith("avif") || brand === "avis") {
      return { encodingFormat: "image/avif", ext: "avif", kind: "image" };
    }
    if (
      brand === "heic" ||
      brand === "heix" ||
      brand === "hevc" ||
      brand === "mif1" ||
      brand === "msf1"
    ) {
      return { encodingFormat: "image/heic", ext: "heic", kind: "image" };
    }
  }
  return undefined;
}

function sniffSvgText(bytes: Uint8Array): SniffResult | undefined {
  const head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.subarray(0, Math.min(bytes.length, 512)))
    .trimStart()
    .toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    if (head.includes("<svg")) {
      return { encodingFormat: "image/svg+xml", ext: "svg", kind: "image" };
    }
  }
  return undefined;
}

export function sniffMime(
  bytes: Uint8Array,
  fallbackMediaType?: string,
): SniffResult {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { encodingFormat: "image/jpeg", ext: "jpg", kind: "image" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { encodingFormat: "image/png", ext: "png", kind: "image" };
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46
  ) {
    return { encodingFormat: "image/gif", ext: "gif", kind: "image" };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { encodingFormat: "image/webp", ext: "webp", kind: "image" };
  }
  const ftyp = isFtypAvifOrHeic(bytes);
  if (ftyp) return ftyp;
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return { encodingFormat: "application/pdf", ext: "pdf", kind: "file" };
  }
  const svg = sniffSvgText(bytes);
  if (svg) return svg;

  if (fallbackMediaType) {
    const ext = EXT_BY_MIME[fallbackMediaType] ?? "bin";
    const kind = fallbackMediaType.startsWith("image/") ? "image" : "file";
    return { encodingFormat: fallbackMediaType, ext, kind };
  }

  return {
    encodingFormat: "application/octet-stream",
    ext: "bin",
    kind: "file",
  };
}

export function extFromMime(mime: string): string {
  return EXT_BY_MIME[mime] ?? "bin";
}
