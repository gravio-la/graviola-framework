import type { FacetBucket, FacetResult } from "@graviola/store-core";

import type { FacetDescriptor, FacetSelection } from "./types";

export function normalizeBuckets(
  distribution: Record<string, number> | undefined,
  selection: FacetSelection,
  descriptor: FacetDescriptor,
): FacetBucket[] {
  const buckets: FacetBucket[] = [];
  const scopeSel = selection[descriptor.scope];
  const selected =
    scopeSel?.kind === "terms" ? scopeSel.values.map(String) : [];

  if (distribution) {
    for (const [value, count] of Object.entries(distribution)) {
      buckets.push({ value, count });
    }
  }

  for (const val of selected) {
    if (!buckets.some((b) => String(b.value) === val)) {
      buckets.push({ value: val, count: 0 });
    }
  }

  buckets.sort(
    (a, b) =>
      b.count - a.count || String(a.value).localeCompare(String(b.value)),
  );

  const max = descriptor.maxValues ?? buckets.length;
  return buckets.slice(0, max);
}

export function mergeFacetResults(results: FacetResult[]): FacetResult {
  if (results.length === 0) {
    return { matched: 0, facets: {}, approximate: false };
  }
  if (results.length === 1) return results[0]!;

  let matched = 0;
  const facets: Record<string, FacetBucket[]> = {};
  const facetStats: Record<string, { min: number; max: number }> = {};

  for (const r of results) {
    matched += r.matched;
    for (const [field, buckets] of Object.entries(r.facets)) {
      const existing = facets[field] ?? [];
      const byValue = new Map(existing.map((b) => [String(b.value), { ...b }]));
      for (const b of buckets) {
        const key = String(b.value);
        const prev = byValue.get(key);
        if (prev) prev.count += b.count;
        else byValue.set(key, { ...b });
      }
      facets[field] = [...byValue.values()].sort((a, b) => b.count - a.count);
    }
    if (r.facetStats) {
      for (const [field, stats] of Object.entries(r.facetStats)) {
        const prev = facetStats[field];
        facetStats[field] = prev
          ? {
              min: Math.min(prev.min, stats.min),
              max: Math.max(prev.max, stats.max),
            }
          : { ...stats };
      }
    }
  }

  return {
    matched,
    facets,
    facetStats: Object.keys(facetStats).length ? facetStats : undefined,
    approximate: true,
  };
}
