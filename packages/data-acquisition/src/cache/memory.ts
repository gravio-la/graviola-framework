import type { AcquisitionCache, CacheEntryEnvelope, CacheStats } from "./types";

export type { AcquisitionCache, CacheEntryEnvelope, CacheStats };
export type { AcquisitionCacheOptions } from "./types";

/**
 * In-memory acquisition cache — isomorphic (browser + Bun/Node).
 * Prefer this from the main package barrel; use `@graviola/data-acquisition/cache/node`
 * when a filesystem-backed cache is required.
 */
export const createMemoryCache = (
  options: { refresh?: boolean; offline?: boolean } = {},
): AcquisitionCache => {
  const store = new Map<string, CacheEntryEnvelope>();
  const stats: CacheStats = { hits: 0, misses: 0, writes: 0 };
  const { refresh = false, offline = false } = options;

  return {
    pathFor: (key) => `memory:${key}`,
    stats: () => ({ ...stats }),
    get: async <T>(key: string, hash: string) => {
      if (refresh) {
        stats.misses += 1;
        return null;
      }
      const entry = store.get(key);
      if (!entry) {
        stats.misses += 1;
        if (offline) {
          throw new Error(`Cache miss for "${key}" while offline`);
        }
        return null;
      }
      if (entry.hash !== hash) {
        stats.misses += 1;
        if (offline) {
          throw new Error(`Cache hash mismatch for "${key}" while offline`);
        }
        return null;
      }
      if (entry.maxAgeSeconds != null) {
        const age = (Date.now() - Date.parse(entry.storedAt)) / 1000;
        if (age > entry.maxAgeSeconds) {
          stats.misses += 1;
          if (offline) {
            throw new Error(`Cache expired for "${key}" while offline`);
          }
          return null;
        }
      }
      stats.hits += 1;
      return {
        value: entry.value as T,
        cache: offline ? "offline-hit" : "hit",
      };
    },
    set: async (key, hash, value, maxAgeSeconds) => {
      store.set(key, {
        storedAt: new Date().toISOString(),
        hash,
        maxAgeSeconds,
        value,
      });
      stats.writes += 1;
    },
  };
};
