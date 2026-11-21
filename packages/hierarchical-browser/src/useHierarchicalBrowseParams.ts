import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  applyHierarchicalBrowseParams,
  browseParamsSort,
  parseHierarchicalBrowseParams,
  type HierarchicalBrowseParamKeyConfig,
} from "./browseParams";
import type { HierarchicalBrowseParams, ListingSort } from "./types";

export type UseHierarchicalBrowseParamsOptions = {
  keys?: HierarchicalBrowseParamKeyConfig;
};

export type HierarchicalBrowseParamsController = {
  params: HierarchicalBrowseParams;
  sort: ListingSort[];
  setParams: (patch: Partial<HierarchicalBrowseParams>) => void;
  setSort: (sort: ListingSort[] | undefined) => void;
};

/**
 * Bookmarkable browse URL state: `root`, `selected`, `view`, `sort`.
 * Apps may pass `keys.selectedAlias` (e.g. `"dir"`) for read-compat.
 */
export function useHierarchicalBrowseParams(
  options: UseHierarchicalBrowseParamsOptions = {},
): HierarchicalBrowseParamsController {
  const [searchParams, setSearchParams] = useSearchParams();
  const { keys } = options;

  const params = useMemo(
    () => parseHierarchicalBrowseParams(searchParams, keys),
    [searchParams, keys],
  );

  const sort = useMemo(() => browseParamsSort(params), [params]);

  const setParams = useCallback(
    (patch: Partial<HierarchicalBrowseParams>) => {
      setSearchParams(
        (prev) => applyHierarchicalBrowseParams(prev, patch, keys),
        { replace: true },
      );
    },
    [keys, setSearchParams],
  );

  const setSort = useCallback(
    (next: ListingSort[] | undefined) => {
      const raw =
        next && next.length > 0
          ? next.map((s) => `${s.field}:${s.desc ? "desc" : "asc"}`).join(",")
          : null;
      setParams({ sort: raw });
    },
    [setParams],
  );

  return { params, sort, setParams, setSort };
}
