import type { JsonLdEntity } from "@graviola/fulltext-search-core";

/** Presentational contract between search hooks and paged list views. */
export type ResultListController<T extends JsonLdEntity = JsonLdEntity> = {
  documents: T[];
  totalHits: number;
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  processingTimeMs?: number;
  query?: string;
  isFetching: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPageChange: (page: number) => void;
};

/** Presentational contract for infinite-scroll list views. */
export type InfiniteResultListController<
  T extends JsonLdEntity = JsonLdEntity,
> = {
  documents: T[];
  totalHits: number;
  loadedCount: number;
  query?: string;
  processingTimeMs?: number;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error?: Error | null;
};

/** Paged search hook result: controller plus TanStack Query status fields. */
export type PagedSearchController<T extends JsonLdEntity = JsonLdEntity> =
  ResultListController<T> & {
    hasData: boolean;
    isError: boolean;
    error: Error | null;
  };

export function buildResultListController<T extends JsonLdEntity>(input: {
  documents: T[];
  estimatedTotalHits?: number;
  processingTimeMs?: number;
  query?: string;
  page: number;
  limit: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}): ResultListController<T> {
  const totalHits = input.estimatedTotalHits ?? input.documents.length ?? 0;
  const offset = input.page * input.limit;
  const totalPages = Math.max(1, Math.ceil(totalHits / input.limit));
  const canGoPrev = input.page > 0;
  const canGoNext = offset + input.limit < totalHits;
  const rangeStart = totalHits === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + input.documents.length, totalHits);

  return {
    documents: input.documents,
    totalHits,
    page: input.page,
    totalPages,
    rangeStart,
    rangeEnd,
    processingTimeMs: input.processingTimeMs,
    query: input.query,
    isFetching: input.isFetching,
    canGoPrev,
    canGoNext,
    onPageChange: input.onPageChange,
  };
}
