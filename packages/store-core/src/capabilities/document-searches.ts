import type { SchemaRegistry } from "../registry";

export type FacetFilterEquality = {
  field: string;
  value: string | number | boolean;
};

export type FacetFilterRange = {
  field: string;
  gte?: number;
  lte?: number;
};

export type FacetFilterIn = {
  field: string;
  values: (string | number | boolean)[];
};

/** Structured facet filter — each engine renders its own syntax. */
export type FacetFilter =
  | FacetFilterEquality
  | FacetFilterRange
  | FacetFilterIn;

export function isFacetFilterRange(f: FacetFilter): f is FacetFilterRange {
  return "gte" in f || "lte" in f;
}

export function isFacetFilterIn(f: FacetFilter): f is FacetFilterIn {
  return "values" in f && Array.isArray(f.values);
}

export type FacetStats = {
  min: number;
  max: number;
};

export type SearchDocumentsOptions = {
  limit?: number;
  offset?: number;
  filters?: FacetFilter[];
  /** Property names or `#/` scopes to request facet counts for (in-band with hits). */
  facets?: string[];
  /**
   * When true, merge each hit with the primary document (default false).
   * Prefers one `filterMany({ entityIRIs })` batch; falls back to N× `loadOne`.
   */
  hydrate?: boolean;
  fields?: string[];
};

/** JSON-LD document returned from filtered full-text search. */
export type SearchDocument = Record<string, unknown> & {
  "@id": string;
  "@type"?: string;
};

export type SearchDocumentsResult<T extends SearchDocument = SearchDocument> = {
  documents: T[];
  estimatedTotalHits?: number;
  processingTimeMs?: number;
  query: string;
  facetDistribution?: Record<string, Record<string, number>>;
  facetStats?: Record<string, FacetStats>;
};

export interface DocumentSearches<R extends SchemaRegistry> {
  searchDocuments<T extends SearchDocument = SearchDocument>(
    typeName: keyof R & string,
    text: string,
    options?: SearchDocumentsOptions,
  ): Promise<SearchDocumentsResult<T>>;
}
