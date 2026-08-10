/**
 * Isomorphic cache surface (memory only).
 * For filesystem cache use `@graviola/data-acquisition/cache/node`.
 */
export type {
  AcquisitionCache,
  AcquisitionCacheOptions,
  CacheEntryEnvelope,
  CacheStats,
} from "./types";
export { createMemoryCache } from "./memory";
