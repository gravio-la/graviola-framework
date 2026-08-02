/**
 * Expected counts for the committed geo.ttl fixture.
 * Drift test asserts these; update when regenerating the dataset.
 */
export const geoStats = {
  City: 127,
  Place: 112,
  Region: 0,
  Country: 0,
  withPopulation: 196,
  sameAs: 239,
  /** Forward `contains` triples (= partOf count; materialized inverse). */
  contains: 223,
  /** Parents that have at least one materialized `contains` child. */
  parentsWithContains: 77,
  /** Parent place with the most children overall (Saxony-Anhalt / Q1206). */
  richestParentIRI: "http://ontologies.gra.one/samples/geo/Place/Q1206",
  richestParentChildCount: 15,
  /**
   * Parent with the most `City` children (Landkreis Görlitz / Q6317).
   * Prefer this for `filterMany("City", { where: { partOf: { "@id": … }}})`
   * and for `include.contains` pagination demos.
   */
  richestCityParentIRI: "http://ontologies.gra.one/samples/geo/Place/Q6317",
  richestCityParentChildCount: 12,
  /** Cities with population &lt; 20_000 (verified against Oxigraph). */
  citiesPopLt20k: 111,
  /** Cities whose name contains lowercase `"burg"` (case-sensitive). */
  citiesNameContainsBurg: 7,
} as const;
