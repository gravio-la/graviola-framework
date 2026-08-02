import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { CacheStats } from "./types";

export type FileCacheOptions = {
  cacheDir: string;
  refresh?: boolean;
  offline?: boolean;
};

export type FileCache = {
  getJson: <T>(key: string) => Promise<T | null>;
  setJson: (key: string, value: unknown) => Promise<void>;
  getText: (key: string) => Promise<string | null>;
  setText: (key: string, value: string) => Promise<void>;
  stats: () => CacheStats;
  pathFor: (key: string) => string;
};

const safeSegment = (segment: string): string =>
  segment.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "x";

/** Allow `/` to create subdirectories; sanitize each path segment. */
const safeKey = (key: string): string =>
  key.split("/").map(safeSegment).join("/");

export const createFileCache = (options: FileCacheOptions): FileCache => {
  const stats: CacheStats = { hits: 0, misses: 0, writes: 0 };
  const { cacheDir, refresh = false, offline = false } = options;

  const pathFor = (key: string) => join(cacheDir, safeKey(key));

  const readRaw = async (key: string): Promise<string | null> => {
    if (refresh) {
      stats.misses += 1;
      return null;
    }
    try {
      const text = await readFile(pathFor(key), "utf8");
      stats.hits += 1;
      return text;
    } catch {
      stats.misses += 1;
      if (offline) {
        throw new Error(
          `Cache miss for "${key}" while --offline is set (${pathFor(key)})`,
        );
      }
      return null;
    }
  };

  const writeRaw = async (key: string, value: string): Promise<void> => {
    const target = pathFor(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, value, "utf8");
    stats.writes += 1;
  };

  return {
    pathFor,
    stats: () => ({ ...stats }),
    getText: async (key) => readRaw(key),
    setText: async (key, value) => writeRaw(key, value),
    getJson: async <T>(key: string) => {
      const text = await readRaw(key);
      if (text === null) return null;
      return JSON.parse(text) as T;
    },
    setJson: async (key, value) =>
      writeRaw(key, `${JSON.stringify(value, null, 2)}\n`),
  };
};
