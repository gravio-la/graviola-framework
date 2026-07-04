import namespace from "@rdfjs/namespace";
import type {
  DeclarativeMapping,
  DeclarativeMappings,
} from "@graviola/edb-data-mapping";

export const sladb = namespace("http://ontologies.slub-dresden.de/exhibition#");

export const locationDeclarativeMapping: DeclarativeMappings = [
  {
    source: {
      path: "preferredName",
    },
    target: {
      path: "title",
    },
  },
  {
    source: {
      path: "biographicalOrHistoricalInformation",
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
      path: "depiction.0.thumbnail",
    },
    target: {
      path: "image",
    },
  },
  {
    source: {
      path: "",
    },
    target: {
      path: "idAuthority.authority",
    },
    mapping: {
      strategy: {
        id: "constant",
        options: {
          value: "http://d-nb.info/gnd",
        },
      },
    },
  },
  {
    source: {
      path: "id",
    },
    target: {
      path: "idAuthority.id",
    },
  },
];

export const corporateBodyDeclarativeMapping: DeclarativeMappings = [
  {
    source: {
      path: "preferredName",
      expectedSchema: {
        type: "string",
      },
    },
    target: {
      path: "name",
    },
  },
  {
    source: {
      path: "variantName",
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
      path: "",
    },
    target: {
      path: "idAuthority.authority",
    },
    mapping: {
      strategy: {
        id: "constant",
        options: {
          value: "http://d-nb.info/gnd",
        },
      },
    },
  },
  {
    source: {
      path: "id",
    },
    target: {
      path: "idAuthority.id",
    },
  },
  {
    source: {
      path: "spatialAreaOfActivity",
    },
    target: {
      path: "location",
    },
    mapping: {
      strategy: {
        id: "createEntity",
        options: {
          single: true,
          typeIRI: sladb("Location").value,
          typeName: "Location",
          subFieldMapping: {
            fromEntity: locationDeclarativeMapping,
          },
        },
      },
    },
  },
];

export const exhibitionDeclarativeMapping: DeclarativeMappings = [
  {
    source: {
      path: "preferredName",
      expectedSchema: {
        type: "string",
      },
    },
    target: {
      path: "title",
    },
  },
  {
    source: {
      path: "",
    },
    target: {
      path: "idAuthority.authority",
    },
    mapping: {
      strategy: {
        id: "constant",
        options: {
          value: "http://d-nb.info/gnd",
        },
      },
    },
  },
  {
    source: {
      path: "id",
    },
    target: {
      path: "idAuthority.id",
    },
  },
  {
    source: {
      path: "biographicalOrHistoricalInformation",
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

export const occupationDeclarativeMapping: DeclarativeMappings = [
  {
    source: {
      path: "label",
    },
    target: {
      path: "title",
    },
  },
  {
    source: {
      path: "",
    },
    target: {
      path: "idAuthority.authority",
    },
    mapping: {
      strategy: {
        id: "constant",
        options: {
          value: "http://d-nb.info/gnd",
        },
      },
    },
  },
  {
    source: {
      path: "id",
    },
    target: {
      path: "idAuthority.id",
    },
  },
];

export const personDeclarativeMapping: DeclarativeMappings = [
  {
    source: {
      path: "preferredName",
      expectedSchema: {
        type: "string",
      },
    },
    target: {
      path: "name",
    },
  },
  {
    source: {
      path: "variantName",
      expectedSchema: {
        type: "array",
        items: {
          type: "string",
        },
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
      path: "dateOfBirth",
      expectedSchema: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
      },
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
      expectedSchema: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
      },
      path: "dateOfDeath",
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
      path: "dateOfDeath",
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
      path: "professionOrOccupation",
    },
    target: {
      path: "profession",
    },
    mapping: {
      strategy: {
        id: "createEntity",
        options: {
          typeIRI: sladb("Occupation").value,
          typeName: "Occupation",
          subFieldMapping: {
            fromEntity: occupationDeclarativeMapping,
          },
        },
      },
    },
  },
  {
    source: {
      path: "depiction.0.thumbnail",
    },
    target: {
      path: "image",
    },
  },
  {
    source: {
      path: "id",
    },
    target: {
      path: "idAuthority.id",
    },
  },
  {
    source: {
      path: "",
    },
    target: {
      path: "idAuthority.authority",
    },
    mapping: {
      strategy: {
        id: "constant",
        options: {
          value: "http://d-nb.info/gnd",
        },
      },
    },
  },
];

export const corporateBody2PlaceDeclarativeMapping: DeclarativeMappings = [
  {
    source: {
      path: "preferredName",
      expectedSchema: {
        type: "string",
      },
    },
    target: {
      path: "title",
    },
  },
  {
    source: {
      path: "id",
    },
    target: {
      path: "idAuthority.id",
    },
  },
  {
    source: {
      path: "placeOfBusiness",
    },
    target: {
      path: "location",
    },
    mapping: {
      strategy: {
        id: "createEntity",
        options: {
          single: true,
          typeIRI: sladb("Location").value,
          typeName: "Location",
          subFieldMapping: {
            fromEntity: locationDeclarativeMapping,
          },
        },
      },
    },
  },
];

export const lobidTypemap: Record<string, string | string[]> = {
  Exhibition: "ConferenceOrEvent",
  Person: "DifferentiatedPerson",
  Corporation: "CorporateBody",
  Place: "CorporateBody",
  Location: "TerritorialCorporateBodyOrAdministrativeUnit",
  Occupation: "SubjectHeading",
};

export const lobidMappings: DeclarativeMapping = {
  Exhibition: exhibitionDeclarativeMapping,
  Person: personDeclarativeMapping,
  Corporation: corporateBodyDeclarativeMapping,
  Place: corporateBody2PlaceDeclarativeMapping,
  Location: locationDeclarativeMapping,
};
