import type { FacetFilter, FacetStats } from "@graviola/store-core";

/** Normalized index settings — engine adapters map to native syntax. */
export type IndexSettings = {
  primaryKey?: string;
  searchableAttributes: string[];
  filterableAttributes: string[];
  sortableAttributes?: string[];
};

/** Document stored in a text index (primary key + projected fields + carriers). */
export type IndexDocument = { id: string } & Record<string, unknown>;

export type {
  FacetFilter,
  FacetFilterEquality,
  FacetFilterRange,
  FacetFilterIn,
  FacetStats,
} from "@graviola/store-core";
export { isFacetFilterRange, isFacetFilterIn } from "@graviola/store-core";

export type FacetSearchValuesQuery = {
  facetName: string;
  q: string;
  filters?: FacetFilter[];
};

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
  facetStats?: Record<string, FacetStats>;
  processingTimeMs?: number;
  query?: string;
};

/** Document-count stats for an index (engine-agnostic). */
export type IndexStats = {
  numberOfDocuments: number;
};

/**
 * Single boundary every full-text engine implements (Meilisearch, Elasticsearch, Solr, Lunr, …).
 */
export interface FullTextSearchAdapter {
  readonly engine: string;
  ensureIndex(uid: string, settings: IndexSettings): Promise<void>;
  addDocuments(uid: string, docs: IndexDocument[]): Promise<void>;
  /** Remove documents by primary key (no-op for missing ids). */
  deleteDocuments?(uid: string, ids: string[]): Promise<void>;
  search(uid: string, q: TextIndexQuery): Promise<TextIndexResult>;
  clearIndex?(uid: string): Promise<void>;
  deleteIndex?(uid: string): Promise<void>;
  /** Read live settings; `null` if the index does not exist. */
  getIndexSettings?(uid: string): Promise<IndexSettings | null>;
  /** Read document counts; `null` if the index does not exist. */
  getIndexStats?(uid: string): Promise<IndexStats | null>;
  /** Optional id charset sanitiser; core falls back to base64url. */
  sanitizeId?(id: string): string;
  /** High-cardinality facet value search (Meili facet-search, Solr terms, …). */
  searchFacetValues?(
    uid: string,
    query: FacetSearchValuesQuery,
  ): Promise<Record<string, number>>;
}
