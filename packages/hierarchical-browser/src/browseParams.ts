import type { HierarchicalBrowseParams } from "./types";
import { parseSortParam, serializeSortParam } from "./sortDocuments";
import type { ListingSort } from "./types";

export const HIERARCHICAL_BROWSE_PARAM_KEYS = {
  root: "root",
  selected: "selected",
  view: "view",
  sort: "sort",
} as const;

export type HierarchicalBrowseParamKeyConfig = {
  root?: string;
  /** Primary selected-entity param (framework default: `selected`). */
  selected?: string;
  /**
   * Optional alias also read for selected (e.g. app bookmark compat).
   * Writes always use `selected` key unless only the alias is configured.
   */
  selectedAlias?: string;
  view?: string;
  sort?: string;
};

const DEFAULT_KEYS: Required<
  Omit<HierarchicalBrowseParamKeyConfig, "selectedAlias">
> & { selectedAlias?: string } = {
  root: HIERARCHICAL_BROWSE_PARAM_KEYS.root,
  selected: HIERARCHICAL_BROWSE_PARAM_KEYS.selected,
  view: HIERARCHICAL_BROWSE_PARAM_KEYS.view,
  sort: HIERARCHICAL_BROWSE_PARAM_KEYS.sort,
};

function resolveKeys(
  keys?: HierarchicalBrowseParamKeyConfig,
): typeof DEFAULT_KEYS {
  return { ...DEFAULT_KEYS, ...keys };
}

export function parseHierarchicalBrowseParams(
  searchParams: URLSearchParams,
  keys?: HierarchicalBrowseParamKeyConfig,
): HierarchicalBrowseParams {
  const k = resolveKeys(keys);
  const selected =
    searchParams.get(k.selected) ??
    (k.selectedAlias ? searchParams.get(k.selectedAlias) : null);
  return {
    root: searchParams.get(k.root),
    selected,
    view: searchParams.get(k.view),
    sort: searchParams.get(k.sort),
  };
}

/**
 * Apply browse state onto a copy of `searchParams`.
 * Clears keys when values are null/undefined/empty.
 */
export function applyHierarchicalBrowseParams(
  searchParams: URLSearchParams,
  patch: Partial<HierarchicalBrowseParams>,
  keys?: HierarchicalBrowseParamKeyConfig,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  const k = resolveKeys(keys);

  const setOrDelete = (key: string, value: string | null | undefined) => {
    if (value == null || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  };

  if ("root" in patch) setOrDelete(k.root, patch.root);
  if ("selected" in patch) {
    setOrDelete(k.selected, patch.selected);
    if (k.selectedAlias && k.selectedAlias !== k.selected) {
      // Drop legacy alias so bookmarks converge on the canonical key.
      next.delete(k.selectedAlias);
    }
  }
  if ("view" in patch) setOrDelete(k.view, patch.view ?? null);
  if ("sort" in patch) setOrDelete(k.sort, patch.sort);

  return next;
}

export function browseParamsSort(
  params: HierarchicalBrowseParams,
): ListingSort[] {
  return parseSortParam(params.sort);
}

export function browseParamsWithSort(
  params: HierarchicalBrowseParams,
  sort: ListingSort[] | undefined,
): HierarchicalBrowseParams {
  return {
    ...params,
    sort: serializeSortParam(sort),
  };
}
