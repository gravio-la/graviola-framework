import type { JSONSchema7 } from "json-schema";
import type {
  CardPresentationRegistry,
  PrimaryFieldDeclaration,
  TypePresentationRegistry,
} from "@graviola/edb-core-types";

import {
  BACH_PORTRAIT_HAUSSMANN_URL,
  FUGA_RECORDING_URL,
} from "./cardShowcaseAudio";

export const MUSIC_STORY_NS = "http://www.example.org/music/";

const typeConst = (name: string) => ({
  type: "string" as const,
  const: `${MUSIC_STORY_NS}${name}`,
});

/** Music domain — Bach works with schema-driven play action. */
export const musicStorySchema: JSONSchema7 = {
  type: "object",
  definitions: {
    MusicalWork: {
      type: "object",
      title: "Musical work",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("MusicalWork"),
        title: { type: "string", title: "Title" },
        tagline: { type: "string", title: "Tagline" },
        coverArt: { type: "string", format: "uri", title: "Cover art" },
        recording: {
          type: "string",
          format: "uri",
          title: "Recording",
          contentMediaType: "audio/ogg",
        },
        bwv: { type: "string", title: "BWV" },
        releaseYear: { type: "integer", title: "Year" },
        genre: { type: "string", title: "Genre" },
        composer: { $ref: "#/definitions/Composer" },
      },
    },
    Composer: {
      type: "object",
      title: "Composer",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Composer"),
        name: { type: "string", title: "Name" },
        description: { type: "string", title: "Era" },
        image: { type: "string", format: "uri", title: "Portrait" },
      },
    },
  },
};

export const musicPrimaryFields: PrimaryFieldDeclaration = {
  MusicalWork: {
    label: "title",
    description: "tagline",
    image: "coverArt",
  },
  Composer: {
    label: "name",
    description: "description",
    image: "image",
  },
};

export const musicCardPresentation: CardPresentationRegistry = {
  MusicalWork: {
    variant: "elevated",
    orientation: "vertical",
    size: "standard",
    mediaAspectRatio: "4 / 5",
    mediaOverlay: true,
    secondaryFields: ["bwv", "releaseYear", "genre"],
    hidePropertyLabels: true,
  },
  Composer: {
    variant: "filled",
    orientation: "vertical",
    size: "compact",
    mediaAspectRatio: "1 / 1",
    secondaryFields: ["description"],
    hidePropertyLabels: true,
  },
};

export const musicTypePresentation: TypePresentationRegistry = {
  MusicalWork: { icon: "🎻", color: "secondary" },
  Composer: { icon: "🎼", color: "primary" },
};

export function musicTypeNameToTypeIRI(typeName: string): string {
  return `${MUSIC_STORY_NS}${typeName}`;
}

export function musicTypeIRIToTypeName(iri: string): string | undefined {
  if (!iri.startsWith(MUSIC_STORY_NS)) return undefined;
  return iri.slice(MUSIC_STORY_NS.length);
}

export const sampleComposerBach = {
  "@id": `${MUSIC_STORY_NS}Composer/bach`,
  "@type": `${MUSIC_STORY_NS}Composer`,
  name: "Johann Sebastian Bach",
  description: "Barock",
  image: BACH_PORTRAIT_HAUSSMANN_URL,
};

/** Fuge g-Moll (4. Satz), BWV 1001 — personal violin recording in fixtures/fuga.ogg. */
export const sampleMusicalWorkFuga = {
  "@id": `${MUSIC_STORY_NS}MusicalWork/bwv-1001-fuge`,
  "@type": `${MUSIC_STORY_NS}MusicalWork`,
  title: "Fuge g-Moll",
  tagline:
    "Violinsonate Nr. 1 g-Moll, BWV 1001 — 4. Satz (1720, Sei Solo Nr. 1); verwandt mit BWV 1000 (Laute)",
  coverArt: BACH_PORTRAIT_HAUSSMANN_URL,
  recording: FUGA_RECORDING_URL,
  bwv: "BWV 1001",
  releaseYear: 1720,
  genre: "Sonate",
  composer: sampleComposerBach,
};

export const sampleMusicalWorkPrelude = {
  "@id": `${MUSIC_STORY_NS}MusicalWork/bwv-855-prelude`,
  "@type": `${MUSIC_STORY_NS}MusicalWork`,
  title: "Präludium e-Moll",
  tagline: "Wohltemperiertes Klavier I, Buch 1",
  coverArt: BACH_PORTRAIT_HAUSSMANN_URL,
  bwv: "BWV 855",
  releaseYear: 1722,
  genre: "Barock",
  composer: sampleComposerBach,
};
