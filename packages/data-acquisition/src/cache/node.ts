import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  AcquisitionCache,
  AcquisitionCacheOptions,
  CacheEntryEnvelope,
  CacheStats,
} from "./types";

const safeSegment = (segment: string): string =>
  segment.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "x";

const safeKey = (key: string): string =>
  key.split("/").map(safeSegment).join("/");

/**
 * Filesystem-backed acquisition cache (Node/Bun only).
 * Import from `@graviola/data-acquisition/cache/node` — not the main barrel —
 * so browser bundles never pull `node:fs`.
 */
export const createFileCache = (
  options: AcquisitionCacheOptions & { cacheDir: string },
): AcquisitionCache => {
  const stats: CacheStats = { hits: 0, misses: 0, writes: 0 };
  const { cacheDir, refresh = false, offline = false } = options;
  const pathFor = (key: string) => join(cacheDir, `${safeKey(key)}.json`);

  return {
    pathFor,
    stats: () => ({ ...stats }),
    get: async <T>(key: string, hash: string) => {
      if (refresh) {
        stats.misses += 1;
        return null;
      }
      try {
        const text = await readFile(pathFor(key), "utf8");
        const entry = JSON.parse(text) as CacheEntryEnvelope<T>;
        if (entry.hash !== hash) {
          stats.misses += 1;
          if (offline) {
            throw new Error(
              `Cache hash mismatch for "${key}" while offline (${pathFor(key)})`,
            );
          }
          return null;
        }
        if (entry.maxAgeSeconds != null) {
          const age = (Date.now() - Date.parse(entry.storedAt)) / 1000;
          if (age > entry.maxAgeSeconds) {
            stats.misses += 1;
            if (offline) {
              throw new Error(
                `Cache expired for "${key}" while offline (${pathFor(key)})`,
              );
            }
            return null;
          }
        }
        stats.hits += 1;
        return {
          value: entry.value,
          cache: offline ? "offline-hit" : "hit",
        };
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.includes("while offline") ||
            err.message.includes("hash mismatch") ||
            err.message.includes("expired"))
        ) {
          throw err;
        }
        stats.misses += 1;
        if (offline) {
          throw new Error(
            `Cache miss for "${key}" while offline (${pathFor(key)})`,
          );
        }
        return null;
      }
    },
    set: async (key, hash, value, maxAgeSeconds) => {
      const target = pathFor(key);
      await mkdir(dirname(target), { recursive: true });
      const envelope: CacheEntryEnvelope = {
        storedAt: new Date().toISOString(),
        hash,
        maxAgeSeconds,
        value,
      };
      await writeFile(target, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");
      stats.writes += 1;
    },
  };
};

export type {
  AcquisitionCache,
  AcquisitionCacheOptions,
  CacheEntryEnvelope,
  CacheStats,
} from "./types";
