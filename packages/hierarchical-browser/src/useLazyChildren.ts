import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type {
  ChildrenListingOptions,
  ChildrenListingSource,
  ListingSort,
} from "./types";

export type UseLazyChildrenOptions = {
  enabled?: boolean;
  sort?: ListingSort[];
  pageSize?: number;
  /**
   * When true and the source provides `listExpandableChildren`, use that
   * instead of `listChildren` (tree-only containers).
   */
  expandableOnly?: boolean;
  /** Query-key namespace so multiple trees on one page do not clash. */
  queryKeyPrefix?: string;
};

export type LazyChildrenController<T = Record<string, unknown>> = {
  documents: T[];
  estimatedTotalHits?: number;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  /** True once at least one successful fetch completed for this parent. */
  hasLoaded: boolean;
};

const ROOT_KEY = "__roots__";

/**
 * One infinite React Query per parent (or roots when `parentId` is null).
 * Powers lazy tree expansion and optional “load more”.
 */
export function useLazyChildren<T = Record<string, unknown>>(
  parentId: string | null,
  source: ChildrenListingSource<T>,
  options: UseLazyChildrenOptions = {},
): LazyChildrenController<T> {
  const {
    enabled = true,
    sort,
    pageSize = 50,
    expandableOnly = false,
    queryKeyPrefix = "hierarchical-browser",
  } = options;

  const isRoots = parentId == null;
  const queryKey = [
    queryKeyPrefix,
    "children",
    isRoots ? ROOT_KEY : parentId,
    expandableOnly ? "expandable" : "all",
    pageSize,
    sort ?? null,
  ] as const;

  const query = useInfiniteQuery({
    queryKey,
    enabled: enabled && (isRoots || Boolean(parentId)),
    initialPageParam: 0,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const opts: ChildrenListingOptions = {
        limit: pageSize,
        offset: pageParam,
        sort,
      };
      if (isRoots) {
        return source.listRoots(opts);
      }
      if (
        expandableOnly &&
        typeof source.listExpandableChildren === "function"
      ) {
        return source.listExpandableChildren!(parentId!, opts);
      }
      return source.listChildren(parentId!, opts);
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (!lastPage.hasMore) return undefined;
      const loaded = (lastPageParam as number) + lastPage.documents.length;
      if (
        lastPage.estimatedTotalHits != null &&
        loaded >= lastPage.estimatedTotalHits
      ) {
        return undefined;
      }
      return loaded;
    },
  });

  return useMemo((): LazyChildrenController<T> => {
    const documents = query.data?.pages.flatMap((page) => page.documents) ?? [];
    const lastPage = query.data?.pages[query.data.pages.length - 1];
    return {
      documents,
      estimatedTotalHits: lastPage?.estimatedTotalHits,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isFetchingNextPage: query.isFetchingNextPage,
      isError: query.isError,
      error: (query.error as Error | null) ?? null,
      hasNextPage: Boolean(query.hasNextPage),
      fetchNextPage: () => {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      },
      hasLoaded: query.isSuccess || query.isError,
    };
  }, [query]);
}
