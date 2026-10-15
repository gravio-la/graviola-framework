export interface ImageSize {
  width: number;
  height: number;
}

export function readImageDimensions(
  bytes: Uint8Array,
  encodingFormat: string,
): ImageSize | undefined {
  switch (encodingFormat) {
    case "image/jpeg":
      return jpegDimensions(bytes);
    case "image/png":
      return pngDimensions(bytes);
    case "image/gif":
      return gifDimensions(bytes);
    case "image/webp":
      return webpDimensions(bytes);
    default:
      return undefined;
  }
}

function jpegDimensions(bytes: Uint8Array): ImageSize | undefined {
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const h = (bytes[i + 5]! << 8) | bytes[i + 6]!;
      const w = (bytes[i + 7]! << 8) | bytes[i + 8]!;
      return { width: w, height: h };
    }
    const len = (bytes[i + 2]! << 8) | bytes[i + 3]!;
    i += 2 + len;
  }
  return undefined;
}

function pngDimensions(bytes: Uint8Array): ImageSize | undefined {
  if (bytes.length < 24) return undefined;
  const w =
    (bytes[16]! << 24) | (bytes[17]! << 16) | (bytes[18]! << 8) | bytes[19]!;
  const h =
    (bytes[20]! << 24) | (bytes[21]! << 16) | (bytes[22]! << 8) | bytes[23]!;
  return { width: w, height: h };
}

function gifDimensions(bytes: Uint8Array): ImageSize | undefined {
  if (bytes.length < 10) return undefined;
  return {
    width: bytes[6]! | (bytes[7]! << 8),
    height: bytes[8]! | (bytes[9]! << 8),
  };
}

function webpDimensions(bytes: Uint8Array): ImageSize | undefined {
  if (bytes.length < 30) return undefined;
  const chunk = String.fromCharCode(
    bytes[12]!,
    bytes[13]!,
    bytes[14]!,
    bytes[15]!,
  );
  if (chunk === "VP8 ") {
    return {
      width: (bytes[26]! | (bytes[27]! << 8)) & 0x3fff,
      height: (bytes[28]! | (bytes[29]! << 8)) & 0x3fff,
    };
  }
  if (chunk === "VP8L" && bytes.length >= 25) {
    const bits =
      bytes[21]! | (bytes[22]! << 8) | (bytes[23]! << 16) | (bytes[24]! << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (chunk === "VP8X" && bytes.length >= 30) {
    const w = 1 + (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16));
    const h = 1 + (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16));
    return { width: w, height: h };
  }
  return undefined;
}
