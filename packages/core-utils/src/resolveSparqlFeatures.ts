import type {
  SPARQLFlavour,
  SparqlFeatureFlags,
  ResolvedSparqlFeatureFlags,
} from "@graviola/edb-core-types";

const ALL_FEATURES_OFF: ResolvedSparqlFeatureFlags = {
  lateralNestedPagination: false,
  bindSingleSubject: false,
  oxigraphEmptyGroupCount: false,
  blazegraphFulltextSearch: false,
};

const SPARQL_FLAVOUR_FEATURES: Record<
  SPARQLFlavour,
  ResolvedSparqlFeatureFlags
> = {
  default: { ...ALL_FEATURES_OFF },
  allegro: { ...ALL_FEATURES_OFF },
  oxigraph: {
    lateralNestedPagination: true,
    bindSingleSubject: true,
    oxigraphEmptyGroupCount: true,
    blazegraphFulltextSearch: false,
  },
  jena: {
    lateralNestedPagination: true,
    bindSingleSubject: false,
    oxigraphEmptyGroupCount: false,
    blazegraphFulltextSearch: false,
  },
  blazegraph: {
    lateralNestedPagination: false,
    bindSingleSubject: false,
    oxigraphEmptyGroupCount: false,
    blazegraphFulltextSearch: true,
  },
};

/**
 * Resolve a flavour profile (+ optional overrides) to a complete feature bag.
 * Query builders branch on these flags, not on the raw flavour string.
 */
export function resolveSparqlFeatures(
  flavour: SPARQLFlavour | undefined,
  overrides?: Partial<SparqlFeatureFlags>,
): ResolvedSparqlFeatureFlags {
  const base =
    SPARQL_FLAVOUR_FEATURES[flavour ?? "default"] ??
    SPARQL_FLAVOUR_FEATURES.default;
  if (!overrides) return { ...base };
  return {
    lateralNestedPagination:
      overrides.lateralNestedPagination ?? base.lateralNestedPagination,
    bindSingleSubject: overrides.bindSingleSubject ?? base.bindSingleSubject,
    oxigraphEmptyGroupCount:
      overrides.oxigraphEmptyGroupCount ?? base.oxigraphEmptyGroupCount,
    blazegraphFulltextSearch:
      overrides.blazegraphFulltextSearch ?? base.blazegraphFulltextSearch,
  };
}
