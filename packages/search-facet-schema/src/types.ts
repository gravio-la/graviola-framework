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
  /** Display label override for facet UI */
  label?: string;
  /** Semantic hint for renderer dispatch: mimeType, bytes, date, person, realm, geo, … */
  kind?: string;
  /** Display order (lower first) */
  order?: number;
  /** Allow multi-select within this facet (default true for filter mode) */
  multi?: boolean;
  /** Max facet values to show (engine / UI hint) */
  maxValues?: number;
  /** Show inline under the search field */
  quick?: boolean;
  /** Index field holding numeric companion for range on non-numeric values (e.g. epoch seconds for dates) */
  numericField?: string;
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
