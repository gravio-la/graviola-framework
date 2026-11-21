import type { FacetFilter } from "@graviola/store-core";

import { IndexSchemaMismatchError } from "./engine";
import type { LiveSettings } from "./live-settings";

export const DEFAULT_INDEX_SCHEMA_MISMATCH_HINT =
  "The search index does not expose the filterable or searchable attributes this query requires. Update index settings or reindex.";

export type ProbeSearchFieldsResult = {
  attributesToSearchOn: string[] | undefined;
  droppedSearchFields: string[];
};

export function probeSearchFields(
  desired: string[] | undefined,
  live: LiveSettings,
  opts: {
    indexUid: string;
    warnDropped: (field: string) => void;
    callerRequestedFields: boolean;
  },
): ProbeSearchFieldsResult {
  const droppedSearchFields: string[] = [];
  if (!desired?.length) {
    return { attributesToSearchOn: undefined, droppedSearchFields };
  }

  if (live.kind !== "known") {
    for (const f of desired) {
      droppedSearchFields.push(f);
      opts.warnDropped(f);
    }
    return { attributesToSearchOn: undefined, droppedSearchFields };
  }

  if (live.searchable === "all") {
    return { attributesToSearchOn: desired, droppedSearchFields };
  }

  const searchable = live.searchable;
  const intersected = desired.filter((f) => {
    if (searchable.has(f)) return true;
    droppedSearchFields.push(f);
    opts.warnDropped(f);
    return false;
  });

  if (intersected.length === 0) {
    return { attributesToSearchOn: undefined, droppedSearchFields };
  }

  return { attributesToSearchOn: intersected, droppedSearchFields };
}

export function assertFiltersFilterable(
  filters: FacetFilter[] | undefined,
  live: LiveSettings,
  indexUid: string,
  opts?: { hint?: string },
): void {
  if (!filters?.length) return;
  if (live.kind !== "known" || live.filterable === "all") return;

  const filterable = live.filterable;
  const missing = [
    ...new Set(
      filters.map((f) => f.field).filter((field) => !filterable.has(field)),
    ),
  ];
  if (missing.length > 0) {
    throw new IndexSchemaMismatchError({
      indexUid,
      missingFilterable: missing,
      hint: opts?.hint,
    });
  }
}

export function probeFacetFields(
  facetIndexFields: string[],
  propertyFields: string[],
  live: LiveSettings,
): {
  facetIndexFields: string[];
  propertyFields: string[];
  unavailableFacets: string[];
} {
  if (live.kind !== "known" || live.filterable === "all") {
    return {
      facetIndexFields,
      propertyFields,
      unavailableFacets: [],
    };
  }

  const filterable = live.filterable;
  const availableIndex: string[] = [];
  const availableProp: string[] = [];
  const unavailableFacets: string[] = [];

  for (let i = 0; i < facetIndexFields.length; i++) {
    const idx = facetIndexFields[i]!;
    const prop = propertyFields[i] ?? idx;
    if (filterable.has(idx)) {
      availableIndex.push(idx);
      availableProp.push(prop);
    } else {
      unavailableFacets.push(prop);
    }
  }

  return {
    facetIndexFields: availableIndex,
    propertyFields: availableProp,
    unavailableFacets,
  };
}

export function assertFacetNameFilterable(
  facetName: string,
  live: LiveSettings,
  indexUid: string,
  opts?: { hint?: string },
): void {
  if (live.kind !== "known" || live.filterable === "all") return;
  if (!live.filterable.has(facetName)) {
    throw new IndexSchemaMismatchError({
      indexUid,
      missingFilterable: [facetName],
      hint: opts?.hint,
    });
  }
}

export function intersectWithFilterable(
  field: string,
  live: LiveSettings,
): boolean {
  if (live.kind !== "known" || live.filterable === "all") return true;
  return live.filterable.has(field);
}

export function intersectWithSortable(
  field: string,
  live: LiveSettings,
): boolean {
  if (live.kind === "unknown") return true;
  if (live.kind !== "known") return false;
  if (live.sortable === "all") return true;
  return live.sortable.has(field);
}

export type ProbeSortFieldsResult = {
  /** Meili-form clauses (`field:asc` / `field:desc`), or undefined when empty. */
  sort: string[] | undefined;
  droppedSortFields: string[];
};

/**
 * Intersect requested sort fields with live `sortableAttributes`.
 * When settings are `"unknown"`, clauses pass through (engine may still reject).
 * When `"missing"` or known with an empty sortable set, non-matching fields are dropped.
 */
export function probeSortFields(
  desired: { field: string; desc?: boolean }[] | undefined,
  live: LiveSettings,
  opts: {
    warnDropped: (field: string) => void;
  },
): ProbeSortFieldsResult {
  const droppedSortFields: string[] = [];
  if (!desired?.length) {
    return { sort: undefined, droppedSortFields };
  }

  const toClause = (entry: { field: string; desc?: boolean }) =>
    `${entry.field}:${entry.desc ? "desc" : "asc"}`;

  if (live.kind === "unknown") {
    return {
      sort: desired.map(toClause),
      droppedSortFields,
    };
  }

  if (live.kind === "missing") {
    for (const entry of desired) {
      droppedSortFields.push(entry.field);
      opts.warnDropped(entry.field);
    }
    return { sort: undefined, droppedSortFields };
  }

  if (live.sortable === "all") {
    return { sort: desired.map(toClause), droppedSortFields };
  }

  const sortable = live.sortable;
  const kept: string[] = [];
  for (const entry of desired) {
    if (sortable.has(entry.field)) {
      kept.push(toClause(entry));
    } else {
      droppedSortFields.push(entry.field);
      opts.warnDropped(entry.field);
    }
  }

  return {
    sort: kept.length > 0 ? kept : undefined,
    droppedSortFields,
  };
}
