import type {
  SparqlEndpoint,
  SPARQLFlavour,
  SparqlFeatureFlags,
  ResolvedSparqlFeatureFlags,
} from "@graviola/edb-core-types";
import { resolveSparqlFeatures } from "@graviola/edb-core-utils";

export { resolveSparqlFeatures };

/**
 * Recommended SPARQL engine profile for an endpoint provider.
 *
 * Maps provider → flavour id (never a bare feature name). Features are
 * resolved via {@link resolveSparqlFeatures} / {@link getSparqlDialect}.
 *
 * Pass `sparqlFlavour` explicitly on store init to override.
 */
export const getSPARQLFlavour = (endpoint?: SparqlEndpoint): SPARQLFlavour => {
  switch (endpoint?.provider) {
    case "oxigraph":
    case "worker":
      return "oxigraph";
    case "blazegraph":
      return "blazegraph";
    case "allegro":
      return "allegro";
    case "fuseki":
      return "jena";
    case "virtuoso":
    case "qlever":
    case "rest":
    default:
      return "default";
  }
};

export type SparqlDialect = {
  flavour: SPARQLFlavour;
  features: ResolvedSparqlFeatureFlags;
};

/**
 * Resolve provider → flavour → features in one step.
 */
export function getSparqlDialect(
  endpoint?: SparqlEndpoint,
  overrides?: Partial<SparqlFeatureFlags>,
): SparqlDialect {
  const flavour = getSPARQLFlavour(endpoint);
  return {
    flavour,
    features: resolveSparqlFeatures(flavour, overrides),
  };
}
