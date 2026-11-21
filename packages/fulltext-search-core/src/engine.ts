import type { FacetFilter, FacetStats } from "@graviola/store-core";

/** Meilisearch codes that mean the query uses attributes the index does not expose. */
export const FULLTEXT_SCHEMA_MISMATCH_CODES = new Set([
  "invalid_search_attributes_to_search_on",
  "invalid_search_filter",
  "invalid_search_facets",
  "invalid_facet_search_facet_name",
]);

export class FullTextEngineError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly indexUid: string;

  constructor(
    message: string,
    opts: { status: number; code?: string; indexUid: string },
  ) {
    super(message);
    this.name = "FullTextEngineError";
    this.status = opts.status;
    this.code = opts.code;
    this.indexUid = opts.indexUid;
  }
}

export class IndexSchemaMismatchError extends Error {
  readonly indexUid: string;
  readonly missingFilterable: string[];
  readonly missingSearchable: string[];
  readonly hint: string;

  constructor(opts: {
    indexUid: string;
    missingFilterable?: string[];
    missingSearchable?: string[];
    hint?: string;
    message?: string;
  }) {
    const missingFilterable = opts.missingFilterable ?? [];
    const missingSearchable = opts.missingSearchable ?? [];
    super(
      opts.message ??
        `Search index "${opts.indexUid}" is missing filterable or searchable attributes required by this app (${[...missingFilterable, ...missingSearchable].join(", ")})`,
    );
    this.name = "IndexSchemaMismatchError";
    this.indexUid = opts.indexUid;
    this.missingFilterable = missingFilterable;
    this.missingSearchable = missingSearchable;
    this.hint =
      opts.hint ??
      "The search index does not expose the filterable or searchable attributes this query requires. Update index settings or reindex.";
  }
}

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
  /** Meilisearch-form sort clauses: `field:asc` / `field:desc`. */
  sort?: string[];
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
  /**
   * Read live settings.
   * - `null` if the index does not exist
   * - `"unknown"` if settings cannot be read (e.g. search-only API key)
   */
  getIndexSettings?(uid: string): Promise<IndexSettings | null | "unknown">;
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
