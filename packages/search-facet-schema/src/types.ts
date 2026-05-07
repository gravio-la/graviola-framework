/**
 * Canonical search/facet configuration alongside the entity JSON Schema — full-text index
 * and facet scopes used by stores and (eventually) a federator.
 *
 * This package owns the runtime validation boundary for standalone documents.
 */

export type ScopePointer = string;

export type FulltextScopeAnnotation = {
  weight?: number;
};

export type FulltextIndexAnnotations = {
  scopes?: Record<ScopePointer, FulltextScopeAnnotation>;
  types?: Record<string, { searchable?: boolean }>;
};

export type FacetMode = "filter" | "range";

export type FacetScopeAnnotation = {
  facet: FacetMode;
};

export type FacetAnnotations = {
  scopes?: Record<ScopePointer, FacetScopeAnnotation>;
};

/**
 * Open extension slot for future top-level sections (access control, computed fields, …).
 * Extra top-level keys are allowed at runtime (`loadSearchFacetSchema` preserves them).
 */
export type SearchFacetSchema = {
  fulltextIndex?: FulltextIndexAnnotations;
  facets?: FacetAnnotations;
};
