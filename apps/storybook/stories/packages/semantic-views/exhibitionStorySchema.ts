import type { JSONSchema7 } from "json-schema";
import type {
  CardPresentationRegistry,
  PrimaryFieldDeclaration,
  TypePresentationRegistry,
} from "@graviola/edb-core-types";

export const EXHIBITION_STORY_NS =
  "http://ontologies.slub-dresden.de/exhibition/storybook/";

const typeConst = (name: string) => ({
  type: "string" as const,
  const: `${EXHIBITION_STORY_NS}${name}`,
});

/** Compact exhibition domain adapted from exhibition-live. */
export const exhibitionStorySchema: JSONSchema7 = {
  type: "object",
  definitions: {
    Exhibition: {
      type: "object",
      title: "Exhibition",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Exhibition"),
        title: { type: "string", title: "Title" },
        subtitle: { type: "string", title: "Subtitle" },
        description: { type: "string", title: "Description" },
        image: { type: "string", format: "uri", title: "Image" },
        fromDateDisplay: { type: "string", title: "From" },
        toDateDisplay: { type: "string", title: "To" },
        places: {
          type: "array",
          items: { $ref: "#/definitions/Place" },
        },
        curators: {
          type: "array",
          items: { $ref: "#/definitions/Person" },
        },
        tags: {
          type: "array",
          items: { $ref: "#/definitions/Tag" },
        },
      },
    },
    Person: {
      type: "object",
      title: "Person",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Person"),
        name: { type: "string", title: "Name" },
        description: { type: "string", title: "Role" },
        image: { type: "string", format: "uri", title: "Portrait" },
      },
    },
    Place: {
      type: "object",
      title: "Place",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Place"),
        title: { type: "string", title: "Place" },
        description: { type: "string", title: "City" },
        image: { type: "string", format: "uri", title: "Image" },
      },
    },
    Tag: {
      type: "object",
      title: "Tag",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Tag"),
        name: { type: "string", title: "Tag" },
        description: { type: "string" },
        image: { type: "string", format: "uri" },
      },
    },
  },
};

export const exhibitionPrimaryFields: PrimaryFieldDeclaration = {
  Exhibition: { label: "title", description: "description", image: "image" },
  Person: { label: "name", description: "description", image: "image" },
  Place: { label: "title", description: "description", image: "image" },
  Tag: { label: "name", description: "description", image: "image" },
};

export const exhibitionCardPresentation: CardPresentationRegistry = {
  Exhibition: {
    variant: "outlined",
    orientation: "horizontal",
    size: "standard",
    mediaAspectRatio: "4 / 3",
    secondaryFields: ["fromDateDisplay", "toDateDisplay"],
    hidePropertyLabels: true,
    actions: [{ id: "show", label: "Details", intent: "show", primary: true }],
  },
  Person: {
    variant: "filled",
    orientation: "vertical",
    size: "compact",
    secondaryFields: ["description"],
    hidePropertyLabels: true,
  },
  Place: {
    variant: "elevated",
    orientation: "vertical",
    size: "compact",
    hidePropertyLabels: true,
  },
};

export const exhibitionTypePresentation: TypePresentationRegistry = {
  Exhibition: { icon: "🏛️", color: "primary" },
  Person: { icon: "👤", color: "secondary" },
  Place: { icon: "📍", color: "info" },
  Tag: { icon: "🏷️", color: "default" },
};

export function exhibitionTypeNameToTypeIRI(typeName: string): string {
  return `${EXHIBITION_STORY_NS}${typeName}`;
}

export function exhibitionTypeIRIToTypeName(iri: string): string | undefined {
  if (!iri.startsWith(EXHIBITION_STORY_NS)) return undefined;
  return iri.slice(EXHIBITION_STORY_NS.length);
}

const DRESDEN_COAT = "/fixtures/dresden-coat.png";
const EXHIBITION_HERO = "/fixtures/otto-dix-der-krieg.jpg";
const OTTO_DIX_PORTRAIT = "/fixtures/otto-dix-portrait.jpg";

/** Otto Dix — DER KRIEG (adapted from exhibition-live EntityDetailCard.stories). */
export const sampleExhibition = {
  "@id": `${EXHIBITION_STORY_NS}Exhibition/otto-dix-2014`,
  "@type": `${EXHIBITION_STORY_NS}Exhibition`,
  title: "Otto Dix. DER KRIEG. Das Dresdner Triptychon",
  subtitle: "100 Jahre Erster Weltkrieg",
  description:
    "2014 jährt sich der Beginn des Ersten Weltkrieges zum 100. Mal. Das Albertinum zeigt Otto Dix' monumentales Triptychon.",
  image: EXHIBITION_HERO,
  fromDateDisplay: "05.04.2014",
  toDateDisplay: "13.07.2014",
  places: [
    {
      "@id": `${EXHIBITION_STORY_NS}Place/albertinum`,
      "@type": `${EXHIBITION_STORY_NS}Place`,
      title: "Albertinum",
      description: "Dresden",
      image: DRESDEN_COAT,
    },
  ],
  curators: [
    {
      "@id": `${EXHIBITION_STORY_NS}Person/otto-dix`,
      "@type": `${EXHIBITION_STORY_NS}Person`,
      name: "Dix, Otto",
      description: "Ausgestellte Künstler:in",
    },
    {
      "@id": `${EXHIBITION_STORY_NS}Person/curator`,
      "@type": `${EXHIBITION_STORY_NS}Person`,
      name: "Dr. Uta Neumann",
      description: "Kuratorin",
    },
  ],
  tags: [
    {
      "@id": `${EXHIBITION_STORY_NS}Tag/ww1`,
      "@type": `${EXHIBITION_STORY_NS}Tag`,
      name: "Erster Weltkrieg",
      description: "Jubiläumsausstellung",
    },
  ],
};

export const sampleExhibitionPerson = {
  "@id": `${EXHIBITION_STORY_NS}Person/otto-dix`,
  "@type": `${EXHIBITION_STORY_NS}Person`,
  name: "Dix, Otto",
  description: "Ausgestellte Künstler:in",
  image: OTTO_DIX_PORTRAIT,
};

export const sampleExhibitionPlace = {
  "@id": `${EXHIBITION_STORY_NS}Place/albertinum`,
  "@type": `${EXHIBITION_STORY_NS}Place`,
  title: "Albertinum",
  description: "Dresden",
  image: DRESDEN_COAT,
};
