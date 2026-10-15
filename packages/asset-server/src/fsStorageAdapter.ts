import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat as fsStat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { randomBytes } from "node:crypto";

import { assertValidStorageKey } from "./validateStorageKey.js";
import type { PutBody, StorageAdapter, StorageStat } from "./storageAdapter.js";

export interface FsStorageAdapterOptions {
  rootDir: string;
}

async function bodyToNodeReadable(
  body: PutBody,
): Promise<NodeJS.ReadableStream> {
  if (body instanceof Uint8Array) {
    return Readable.from(Buffer.from(body));
  }
  if (body instanceof Blob) {
    return Readable.from(body.stream() as unknown as AsyncIterable<Uint8Array>);
  }
  return Readable.from(body as AsyncIterable<Uint8Array>);
}

async function atomicPut(abs: string, body: PutBody): Promise<void> {
  await mkdir(path.dirname(abs), { recursive: true });
  const tmp = path.join(
    path.dirname(abs),
    `.tmp-${randomBytes(8).toString("hex")}-${path.basename(abs)}`,
  );
  try {
    if (body instanceof Uint8Array) {
      await writeFile(tmp, body);
    } else {
      const src = await bodyToNodeReadable(body);
      await pipeline(src, createWriteStream(tmp));
    }
    await rename(tmp, abs);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => undefined);
    throw err;
  }
}

export function FsStorageAdapter(
  options: FsStorageAdapterOptions,
): StorageAdapter {
  const rootDir = path.resolve(options.rootDir);

  const resolveKey = (key: string): string => {
    assertValidStorageKey(key);
    const abs = path.resolve(rootDir, key);
    if (!abs.startsWith(rootDir + path.sep) && abs !== rootDir) {
      throw new Error(`storage key escapes root: ${key}`);
    }
    return abs;
  };

  return {
    async put(key, body) {
      await atomicPut(resolveKey(key), body);
    },

    async putExclusive(key, body) {
      const abs = resolveKey(key);
      await mkdir(path.dirname(abs), { recursive: true });
      let bytes: Uint8Array;
      if (body instanceof Uint8Array) {
        bytes = body;
      } else if (body instanceof Blob) {
        bytes = new Uint8Array(await body.arrayBuffer());
      } else {
        const reader = body.getReader();
        const chunks: Uint8Array[] = [];
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        bytes = Uint8Array.from(chunks.flatMap((c) => [...c]));
      }
      try {
        await writeFile(abs, bytes, { flag: "wx" });
        return true;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "EEXIST") return false;
        throw err;
      }
    },

    async getStream(key) {
      const abs = resolveKey(key);
      const nodeStream = createReadStream(abs);
      return Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
    },

    async stat(key) {
      const abs = resolveKey(key);
      try {
        const s = await fsStat(abs);
        return { size: s.size, mtimeMs: s.mtimeMs };
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
        throw err;
      }
    },

    async delete(key) {
      const abs = resolveKey(key);
      await rm(abs, { force: true });
    },

    absolutePath(key) {
      return resolveKey(key);
    },
  };
}
