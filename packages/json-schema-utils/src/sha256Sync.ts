import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

/** SHA-256 hex digest of UTF-8 text. Synchronous; browser, Node and Bun. */
export function sha256HexSync(text: string): string {
  return bytesToHex(sha256(utf8ToBytes(text)));
}
