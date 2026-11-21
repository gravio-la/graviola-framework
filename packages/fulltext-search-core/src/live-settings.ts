import type { FullTextSearchAdapter, IndexSettings } from "./engine";

export type AttributeSet = Set<string> | "all";

export type LiveSettings =
  | { kind: "unknown" }
  | { kind: "missing" }
  | {
      kind: "known";
      searchable: AttributeSet;
      filterable: AttributeSet;
      sortable: AttributeSet;
    };

function isWildcardList(xs: string[] | null | undefined): boolean {
  if (xs == null || xs.length === 0) return true;
  return xs.length === 1 && xs[0] === "*";
}

function normalizeSearchable(settings: IndexSettings): AttributeSet {
  if (isWildcardList(settings.searchableAttributes)) return "all";
  return new Set(settings.searchableAttributes);
}

function flattenFilterableEntry(entry: unknown): string[] {
  if (typeof entry === "string") {
    if (entry === "*") return ["*"];
    return [entry];
  }
  if (entry && typeof entry === "object") {
    const patterns = (entry as { attributePatterns?: unknown })
      .attributePatterns;
    if (Array.isArray(patterns)) {
      return patterns.filter((p): p is string => typeof p === "string");
    }
  }
  return [];
}

function normalizeFilterable(settings: IndexSettings): AttributeSet {
  const raw = settings.filterableAttributes as unknown;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return "all";
    const names: string[] = [];
    for (const entry of raw) {
      const flat = flattenFilterableEntry(entry);
      if (flat.includes("*")) return "all";
      names.push(...flat);
    }
    if (names.length === 0) return "all";
    return new Set(names);
  }
  return "all";
}

/**
 * Meili: empty / omitted sortableAttributes means nothing is sortable.
 * `["*"]` means all attributes are sortable.
 */
function normalizeSortable(settings: IndexSettings): AttributeSet {
  const raw = settings.sortableAttributes;
  if (raw == null || raw.length === 0) return new Set();
  if (raw.length === 1 && raw[0] === "*") return "all";
  return new Set(raw);
}

export function liveSettingsFromIndexSettings(
  settings: IndexSettings | null | "unknown",
): LiveSettings {
  if (settings === "unknown") return { kind: "unknown" };
  if (settings == null) return { kind: "missing" };
  return {
    kind: "known",
    searchable: normalizeSearchable(settings),
    filterable: normalizeFilterable(settings),
    sortable: normalizeSortable(settings),
  };
}

export type LiveSettingsCache = {
  get(indexUid: string): Promise<LiveSettings>;
  invalidate(indexUid: string): void;
};

export function createLiveSettingsCache(
  adapter: Pick<FullTextSearchAdapter, "getIndexSettings">,
  options: { ttlMs?: number } = {},
): LiveSettingsCache {
  const ttlMs = options.ttlMs ?? 30_000;
  const cache = new Map<
    string,
    { expires: number; value: LiveSettings; inflight?: Promise<LiveSettings> }
  >();

  async function fetch(indexUid: string): Promise<LiveSettings> {
    if (!adapter.getIndexSettings) return { kind: "unknown" };
    try {
      const raw = await adapter.getIndexSettings(indexUid);
      return liveSettingsFromIndexSettings(raw);
    } catch {
      return { kind: "unknown" };
    }
  }

  return {
    async get(indexUid) {
      const now = Date.now();
      const entry = cache.get(indexUid);
      if (entry && !entry.inflight && entry.expires > now) {
        return entry.value;
      }
      if (entry?.inflight) return entry.inflight;

      const inflight = fetch(indexUid).then((value) => {
        cache.set(indexUid, { expires: Date.now() + ttlMs, value });
        return value;
      });
      cache.set(indexUid, {
        expires: entry?.expires ?? 0,
        value: entry?.value ?? { kind: "unknown" },
        inflight,
      });
      return inflight;
    },
    invalidate(indexUid) {
      cache.delete(indexUid);
    },
  };
}
