export type CacheStats = {
  hits: number;
  misses: number;
  writes: number;
};

export type AcquisitionCacheOptions = {
  cacheDir?: string;
  refresh?: boolean;
  offline?: boolean;
};

export type CacheEntryEnvelope<T = unknown> = {
  storedAt: string;
  hash: string;
  maxAgeSeconds?: number;
  value: T;
};

export type AcquisitionCache = {
  get: <T>(
    key: string,
    hash: string,
  ) => Promise<{
    value: T;
    cache: "hit" | "offline-hit";
  } | null>;
  set: <T>(
    key: string,
    hash: string,
    value: T,
    maxAgeSeconds?: number,
  ) => Promise<void>;
  stats: () => CacheStats;
  pathFor: (key: string) => string;
};
