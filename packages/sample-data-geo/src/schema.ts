import type { JSONSchema7 } from "json-schema";

export const schemaName = "geo-sample";

/** Vocabulary IRI base for types and properties */
export const GEO_VOCAB_BASE = "http://ontologies.gra.one/samples/geo#";

/** Instance IRI base: `{instanceBase}{TypeName}/{QID}` */
export const GEO_INSTANCE_BASE = "http://ontologies.gra.one/samples/geo/";

/** @deprecated Prefer GEO_VOCAB_BASE — kept for sample-data domain compatibility */
export const BASE_IRI = GEO_VOCAB_BASE;

/** @deprecated Prefer GEO_INSTANCE_BASE */
export const INSTANCE_BASE = GEO_INSTANCE_BASE;

const placeProperties: JSONSchema7["properties"] = {
  name: { type: "string", maxLength: 200 },
  description: { type: "string" },
  nameVariants: { type: "string" },
  population: { type: "integer" },
  latitude: { type: "number" },
  longitude: { type: "number" },
  founded: { type: "integer", description: "Foundation year (CE)" },
  image: { type: "string", format: "uri" },
  sameAs: { type: "string", format: "uri" },
  partOf: {
    title: "Parent place",
    $ref: "#/$defs/Place",
  },
  /**
   * Forward child links (stored triples). Materialized by the sample-data
   * pipeline from inverted `partOf` so pagination demos do not depend on
   * `x-inverseOf` (issue #5). Wikidata analogue: P150.
   */
  contains: {
    title: "Contained places",
    type: "array",
    items: { $ref: "#/$defs/Place" },
  },
  parts: {
    title: "Child places (inverse of partOf)",
    type: "array",
    items: { $ref: "#/$defs/Place" },
    // Graviola extension — not in stock JSONSchema7 typings
    ...({
      "x-inverseOf": {
        inverseOf: ["#/$defs/Place/properties/partOf"],
      },
    } as object),
  },
};

/**
 * Simplified geographic places schema.
 * City / Region / Country share the same properties; Place is the recursive
 * target of `partOf` so Wikidata P131 chains map without type branching.
 */
export const geoSchema: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://graviola.la/sample-data/geo#v1",
  title: "Geographic places (sample data)",
  $defs: {
    Place: {
      type: "object",
      title: "Place",
      properties: { ...placeProperties },
    },
    City: {
      type: "object",
      title: "City",
      properties: { ...placeProperties },
    },
    Region: {
      type: "object",
      title: "Region",
      properties: { ...placeProperties },
    },
    Country: {
      type: "object",
      title: "Country",
      properties: { ...placeProperties },
    },
  },
};

/** Alias for sample-data domain compatibility */
export const schema = geoSchema;
