/** Paginated list envelope (v1 wire). */
export type GraviolaListEnvelope<T = unknown> = {
  items: T[];
  pagination?: {
    total?: number | null;
    limit?: number;
    offset?: number;
    next?: string | null;
    hasMore?: boolean;
  };
};

export type GraviolaCountEnvelope = {
  count: number;
};
