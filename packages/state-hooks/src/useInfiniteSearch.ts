import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type {
  FacetFilter,
  FulltextSearchStore,
  JsonLdEntity,
  SearchDocumentsResult,
} from "@graviola/fulltext-search-core";
import type { SchemaRegistry } from "@graviola/store-core";
import type { InfiniteResultListController } from "./resultListController";

export type UseInfiniteSearchParams<
  R extends SchemaRegistry = SchemaRegistry,
  T extends JsonLdEntity = JsonLdEntity,
> = {
  store: FulltextSearchStore<R> | null;
  typeName: keyof R & string;
  query: string;
  limit: number;
  filters?: FacetFilter[];
  hydrate?: boolean;
  enabled?: boolean;
  queryKeyPrefix?: string;
};

export function useInfiniteSearch<
  R extends SchemaRegistry = SchemaRegistry,
  T extends JsonLdEntity = JsonLdEntity,
>(params: UseInfiniteSearchParams<R, T>): InfiniteResultListController<T> {
  const {
    store,
    typeName,
    query: searchQuery,
    limit,
    filters,
    hydrate = false,
    enabled = true,
    queryKeyPrefix = "fulltext-search-infinite",
  } = params;

  const query = useInfiniteQuery({
    queryKey: [
      queryKeyPrefix,
      { query: searchQuery, limit, filters, hydrate },
      typeName,
    ],
    queryFn: ({ pageParam }) =>
      store!.searchDocuments<T>(typeName, searchQuery, {
        limit,
        offset: pageParam,
        hydrate,
        filters,
      }),
    initialPageParam: 0,
    getNextPageParam: (
      _lastPage: SearchDocumentsResult<T>,
      allPages: SearchDocumentsResult<T>[],
      lastPageParam: number,
    ) => {
      const loaded = allPages.reduce((n, p) => n + p.documents.length, 0);
      const total = allPages[0]?.estimatedTotalHits ?? 0;
      if (loaded >= total) return undefined;
      return lastPageParam + limit;
    },
    enabled: enabled && Boolean(store),
  });

  return useMemo((): InfiniteResultListController<T> => {
    const pages = query.data?.pages ?? [];
    const documents = pages.flatMap((p) => p.documents);
    const loadedCount = documents.length;
    const totalHits = pages[0]?.estimatedTotalHits ?? loadedCount;
    const lastPage = pages.at(-1);

    return {
      documents,
      totalHits,
      loadedCount,
      query: lastPage?.query ?? searchQuery,
      processingTimeMs: lastPage?.processingTimeMs,
      isFetching: query.isFetching,
      isFetchingNextPage: query.isFetchingNextPage,
      hasNextPage: query.hasNextPage,
      fetchNextPage: () => {
        if (query.hasNextPage && !query.isFetching) {
          void query.fetchNextPage();
        }
      },
      error: query.error as Error | null,
    };
  }, [query, searchQuery]);
}
