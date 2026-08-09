import type { IndexSettings } from "../engine";

function sortedCopy(xs: string[] | undefined): string[] {
  return [...(xs ?? [])].sort();
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export type IndexSettingsDrift = {
  searchableAttributes: boolean;
  filterableAttributes: boolean;
  sortableAttributes: boolean;
};

/**
 * Compare desired vs live index settings (order-insensitive attribute lists).
 * Returns null when both sides match.
 */
export function diffIndexSettings(
  desired: IndexSettings,
  live: IndexSettings | null,
): IndexSettingsDrift | null {
  if (live == null) {
    return {
      searchableAttributes: true,
      filterableAttributes: true,
      sortableAttributes: true,
    };
  }

  const drift: IndexSettingsDrift = {
    searchableAttributes: !arraysEqual(
      sortedCopy(desired.searchableAttributes),
      sortedCopy(live.searchableAttributes),
    ),
    filterableAttributes: !arraysEqual(
      sortedCopy(desired.filterableAttributes),
      sortedCopy(live.filterableAttributes),
    ),
    sortableAttributes: !arraysEqual(
      sortedCopy(desired.sortableAttributes),
      sortedCopy(live.sortableAttributes),
    ),
  };

  if (
    !drift.searchableAttributes &&
    !drift.filterableAttributes &&
    !drift.sortableAttributes
  ) {
    return null;
  }
  return drift;
}

export function hasAnyDrift(drift: IndexSettingsDrift | null): boolean {
  return drift != null;
}
