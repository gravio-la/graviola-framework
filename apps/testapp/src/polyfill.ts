import { Buffer } from "buffer";

if (typeof globalThis !== "undefined" && !(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

// No top-level await: the default Vite build target (es2020) rejects it, and
// ordering only needs the Buffer assignment above to run before main loads.
void import("./main.tsx");
