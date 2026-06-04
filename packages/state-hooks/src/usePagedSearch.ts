import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  FacetFilter,
  FulltextSearchStore,
  JsonLdEntity,
} from "@graviola/fulltext-search-core";
import type { SchemaRegistry } from "@graviola/store-core";
import {
  buildResultListController,
  type PagedSearchController,
} from "./resultListController";

export type UsePagedSearchParams<
  R extends SchemaRegistry = SchemaRegistry,
  T extends JsonLdEntity = JsonLdEntity,
> = {
  store: FulltextSearchStore<R> | null;
  typeName: keyof R & string;
  query: string;
  page: number;
  limit: number;
  filters?: FacetFilter[];
  hydrate?: boolean;
  enabled?: boolean;
  queryKeyPrefix?: string;
  onPageChange: (page: number) => void;
};

export function usePagedSearch<
  R extends SchemaRegistry = SchemaRegistry,
  T extends JsonLdEntity = JsonLdEntity,
>(params: UsePagedSearchParams<R, T>): PagedSearchController<T> {
  const {
    store,
    typeName,
    query: searchQuery,
    page,
    limit,
    filters,
    hydrate = false,
    enabled = true,
    queryKeyPrefix = "fulltext-search-paged",
    onPageChange,
  } = params;

  const offset = page * limit;

  const searchParams = useMemo(
    () => ({
      query: searchQuery,
      limit,
      offset,
      filters,
      hydrate,
    }),
    [searchQuery, limit, offset, filters, hydrate],
  );

  const query = useQuery({
    queryKey: [queryKeyPrefix, searchParams, typeName],
    queryFn: () =>
      store!.searchDocuments<T>(typeName, searchParams.query, {
        limit: searchParams.limit,
        offset: searchParams.offset,
        hydrate: searchParams.hydrate,
        filters: searchParams.filters,
      }),
    enabled: enabled && Boolean(store),
    placeholderData: (prev) => prev,
  });

  return useMemo((): PagedSearchController<T> => {
    const controller = buildResultListController({
      documents: query.data?.documents ?? [],
      estimatedTotalHits: query.data?.estimatedTotalHits,
      processingTimeMs: query.data?.processingTimeMs,
      query: query.data?.query,
      page,
      limit,
      isFetching: query.isFetching,
      onPageChange,
    });

    return {
      ...controller,
      hasData: Boolean(query.data),
      isError: query.isError,
      error: (query.error as Error | null) ?? null,
    };
  }, [
    query.data,
    query.isFetching,
    query.isError,
    query.error,
    page,
    limit,
    onPageChange,
  ]);
}
