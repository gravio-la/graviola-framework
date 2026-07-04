import namespace from "@rdfjs/namespace";
import type {
  DeclarativeMapping,
  DeclarativeMappings,
} from "@graviola/edb-data-mapping";

import { SLUB_LOD_AUTHORITY, slubLodTypeMap } from "./slubLodAccess";

export { slubLodTypeMap };

export const sladb = namespace("http://ontologies.slub-dresden.de/exhibition#");

const slubAuthoritativeLinkOptions = {
  mainProperty: { offset: 0 },
  authorityFields: [
    {
      offset: 1,
      authorityIRI: SLUB_LOD_AUTHORITY,
      authorityLinkPrefix: "",
    },
  ],
};

export const slubPersonMapping: DeclarativeMappings = [
  {
    source: {
      path: "preferredName",
      expectedSchema: { type: "string" },
    },
    target: {
      path: "name",
    },
  },
  {
    source: {
      path: "alternateName",
      expectedSchema: {
        type: "array",
        items: { type: "string" },
      },
    },
    target: {
      path: "nameVariant",
    },
    mapping: {
      strategy: {
        id: "append",
      },
    },
  },
  {
    source: {
      path: "$.birthDate['@value']",
    },
    target: {
      path: "birthDate",
    },
    mapping: {
      strategy: {
        id: "dateStringToSpecialInt",
      },
    },
  },
  {
    source: {
      path: "$.deathDate['@value']",
    },
    target: {
      path: "deathDate",
    },
    mapping: {
      strategy: {
        id: "dateStringToSpecialInt",
      },
    },
  },
  {
    source: {
      path: "$.deathDate['@value']",
    },
    target: {
      path: "personDeceased",
    },
    mapping: {
      strategy: {
        id: "exists",
      },
    },
  },
  {
    source: {
      path: "$.about[?(@.identifier.propertyID=='biographicalOrHistoricalInformation')].identifier.value",
    },
    target: {
      path: "description",
    },
    mapping: {
      strategy: {
        id: "concatenate",
        options: {
          separator: "\n",
        },
      },
    },
  },
  {
    source: {
      path: "$.birthPlace['name','@id']",
    },
    target: {
      path: "birthPlace",
    },
    mapping: {
      strategy: {
        id: "createEntityWithAuthoritativeLink",
        options: {
          single: true,
          typeIRI: sladb("Place").value,
          typeName: "Place",
          ...slubAuthoritativeLinkOptions,
        },
      },
    },
  },
  {
    source: {
      path: "$.hasOccupation[*]['name','@id']",
    },
    target: {
      path: "profession",
    },
    mapping: {
      strategy: {
        id: "createEntityWithAuthoritativeLink",
        options: {
          typeIRI: sladb("Occupation").value,
          typeName: "Occupation",
          ...slubAuthoritativeLinkOptions,
        },
      },
    },
  },
];

const wikidataAdminParentViaLocationOptions = {
  single: true,
  typeIRI: sladb("Location").value,
  typeName: "Location",
  mainProperty: {
    offset: 0,
  },
  authorityFields: [
    {
      offset: 0,
      authorityLinkPrefix: "http://www.wikidata.org/entity/",
      authorityIRI: "http://www.wikidata.org",
    },
  ],
};

const slubGeoBaseMapping: DeclarativeMappings = [
  {
    source: {
      path: "preferredName",
      expectedSchema: { type: "string" },
    },
    target: {
      path: "title",
    },
  },
  {
    source: {
      path: "alternateName",
      expectedSchema: {
        type: "array",
        items: { type: "string" },
      },
    },
    target: {
      path: "titleVariants",
    },
    mapping: {
      strategy: {
        id: "concatenate",
        options: {
          separator: ", ",
        },
      },
    },
  },
  {
    source: {
      path: "$.about[?(@.identifier.propertyID=='biographicalOrHistoricalInformation')].identifier.value",
    },
    target: {
      path: "description",
    },
    mapping: {
      strategy: {
        id: "concatenate",
        options: {
          separator: "\n",
        },
      },
    },
  },
];

/** Place: P131 admin parent → `location` (mirrors wikidataPlaceMapping P131). */
export const slubPlaceMapping: DeclarativeMappings = [
  ...slubGeoBaseMapping,
  {
    source: {
      path: "$.parentAdminIds[*]",
    },
    target: {
      path: "location",
    },
    mapping: {
      strategy: {
        id: "createEntityWithAuthoritativeLink",
        options: wikidataAdminParentViaLocationOptions,
      },
    },
  },
];

/** Location: P131 admin parent → `parent` (mirrors wikidataLocationMapping P131). */
export const slubLocationMapping: DeclarativeMappings = [
  ...slubGeoBaseMapping,
  {
    source: {
      path: "$.parentAdminIds[*]",
    },
    target: {
      path: "parent",
    },
    mapping: {
      strategy: {
        id: "createEntityWithAuthoritativeLink",
        options: wikidataAdminParentViaLocationOptions,
      },
    },
  },
];

export const slubOccupationMapping: DeclarativeMappings = [
  {
    source: {
      path: "preferredName",
      expectedSchema: { type: "string" },
    },
    target: {
      path: "title",
    },
  },
];

export const slubCorporationMapping: DeclarativeMappings = [
  {
    source: {
      path: "preferredName",
      expectedSchema: { type: "string" },
    },
    target: {
      path: "name",
    },
  },
  {
    source: {
      path: "alternateName",
      expectedSchema: {
        type: "array",
        items: { type: "string" },
      },
    },
    target: {
      path: "nameVariant",
    },
    mapping: {
      strategy: {
        id: "append",
      },
    },
  },
];

export const slubLodMappings: DeclarativeMapping = {
  Person: slubPersonMapping,
  Place: slubPlaceMapping,
  Location: slubLocationMapping,
  Occupation: slubOccupationMapping,
  Corporation: slubCorporationMapping,
};
