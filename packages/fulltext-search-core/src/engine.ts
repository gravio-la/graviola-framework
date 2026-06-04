/** Normalized index settings — engine adapters map to native syntax. */
export type IndexSettings = {
  primaryKey?: string;
  searchableAttributes: string[];
  filterableAttributes: string[];
  sortableAttributes?: string[];
};

/** Document stored in a text index (primary key + projected fields + carriers). */
export type IndexDocument = { id: string } & Record<string, unknown>;

export type FacetFilterEquality = {
  field: string;
  value: string | number | boolean;
};

export type FacetFilterRange = {
  field: string;
  gte?: number;
  lte?: number;
};

/** Structured facet filter — each engine renders its own syntax. */
export type FacetFilter = FacetFilterEquality | FacetFilterRange;

export function isFacetFilterRange(f: FacetFilter): f is FacetFilterRange {
  return "gte" in f || "lte" in f;
}

export type TextIndexQuery = {
  q: string;
  limit: number;
  offset?: number;
  attributesToSearchOn?: string[];
  filters?: FacetFilter[];
  facets?: string[];
};

export type TextIndexHit = {
  id: string;
  score?: number;
  document: Record<string, unknown>;
};

export type TextIndexResult = {
  hits: TextIndexHit[];
  estimatedTotalHits?: number;
  facetDistribution?: Record<string, Record<string, number>>;
  processingTimeMs?: number;
  query?: string;
};

/**
 * Single boundary every full-text engine implements (Meilisearch, Elasticsearch, Solr, Lunr, …).
 */
export interface FullTextSearchAdapter {
  readonly engine: string;
  ensureIndex(uid: string, settings: IndexSettings): Promise<void>;
  addDocuments(uid: string, docs: IndexDocument[]): Promise<void>;
  search(uid: string, q: TextIndexQuery): Promise<TextIndexResult>;
  clearIndex?(uid: string): Promise<void>;
  deleteIndex?(uid: string): Promise<void>;
  /** Optional id charset sanitiser; core falls back to base64url. */
  sanitizeId?(id: string): string;
}
