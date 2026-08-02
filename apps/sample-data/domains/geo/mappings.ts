import namespace from "@rdfjs/namespace";
import type { DeclarativeMappings } from "@graviola/edb-data-mapping";
import { BASE_IRI } from "@graviola/sample-data-geo";

const geo = namespace(BASE_IRI);

const WIKIDATA = "http://www.wikidata.org";
const WD_ENTITY = "http://www.wikidata.org/entity/";

const languageMappings = (
  language: string,
  labelField = "name",
): DeclarativeMappings => [
  {
    source: { path: `$.labels.${language}.value` },
    target: { path: labelField },
    mapping: { strategy: { id: "takeFirst" } },
  },
  {
    source: { path: `$.descriptions.${language}.value` },
    target: { path: "description" },
    mapping: { strategy: { id: "takeFirst" } },
  },
  {
    source: { path: `$.aliases.${language}[*].value` },
    target: { path: "nameVariants" },
    mapping: {
      strategy: {
        id: "concatenate",
        options: { separator: ", " },
      },
    },
  },
];

const imageMapping: DeclarativeMappings[number] = {
  source: { path: "$.claims.P18[*].mainsnak.datavalue.value" },
  target: { path: "image" },
  mapping: {
    strategy: {
      id: "withDotTemplate",
      options: {
        single: true,
        template:
          "http://commons.wikimedia.org/wiki/Special:FilePath/{{value}}",
      },
    },
  },
};

const populationMapping: DeclarativeMappings[number] = {
  // Wikidata quantity amount, e.g. "+554649" — coerced to integer in canonicalize
  source: { path: "$.claims.P1082[*].mainsnak.datavalue.value.amount" },
  target: { path: "population" },
  mapping: { strategy: { id: "takeFirst" } },
};

const coordinatesMappings: DeclarativeMappings = [
  {
    source: { path: "$.claims.P625[*].mainsnak.datavalue.value.latitude" },
    target: { path: "latitude" },
    mapping: { strategy: { id: "takeFirst" } },
  },
  {
    source: { path: "$.claims.P625[*].mainsnak.datavalue.value.longitude" },
    target: { path: "longitude" },
    mapping: { strategy: { id: "takeFirst" } },
  },
];

const foundedMapping: DeclarativeMappings[number] = {
  // Wikidata time, e.g. "+1206-01-01T00:00:00Z" — year extracted in canonicalize
  source: { path: "$.claims.P571[*].mainsnak.datavalue.value.time" },
  target: { path: "founded" },
  mapping: { strategy: { id: "takeFirst" } },
};

const partOfMapping = (
  typeIRI: string,
  typeName: string,
): DeclarativeMappings[number] => ({
  source: { path: "$.claims.P131[*].mainsnak.datavalue.value.id" },
  target: { path: "partOf" },
  mapping: {
    strategy: {
      id: "createEntityWithAuthoritativeLink",
      options: {
        single: true,
        typeIRI,
        typeName,
        mainProperty: { offset: 0 },
        authorityFields: [
          {
            offset: 0,
            authorityLinkPrefix: WD_ENTITY,
            authorityIRI: WIKIDATA,
          },
        ],
      },
    },
  },
});

/**
 * Shared place-like mapping. Parents of any place are typed as Place so the
 * P131 chain (City → Region → Region → Country) recurses with one mapping.
 *
 * Forward children: schema property `contains` is **not** mapped from Wikidata
 * P150 here (that fan-out breaks offline cache + fixture size). Instead the
 * generator materializes `contains` from inverted `partOf` after canonicalize
 * — see `materializeContainsFromPartOf`. P150 is the authority analogue.
 */
const createPlaceLikeMapping = (
  language: string,
  partOfType: "Place" | "Country" = "Place",
): DeclarativeMappings => [
  ...languageMappings(language),
  populationMapping,
  ...coordinatesMappings,
  foundedMapping,
  imageMapping,
  partOfMapping(geo(partOfType).value, partOfType),
];

export const createGeoWikidataMappings = (
  language: string = "de",
): Record<string, DeclarativeMappings> => ({
  City: createPlaceLikeMapping(language, "Place"),
  Place: createPlaceLikeMapping(language, "Place"),
  Region: createPlaceLikeMapping(language, "Place"),
  // Countries usually have no useful P131; keep mapping for completeness
  Country: [
    ...languageMappings(language),
    populationMapping,
    ...coordinatesMappings,
    foundedMapping,
    imageMapping,
  ],
});

export const geoWikidataMappings = createGeoWikidataMappings("de");

export const geoWikidataTypeMap = {
  City: "Q515",
  Place: "Q2221906",
  Region: "Q10864048",
  Country: "Q6256",
};
