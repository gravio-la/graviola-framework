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

export const CARD_SHOWCASE_NS = "http://www.example.org/card-showcase/";

const typeConst = (name: string) => ({
  type: "string" as const,
  const: `${CARD_SHOWCASE_NS}${name}`,
});

/** Schema for compelling M3 card showcase stories (music + social profile). */
export const cardShowcaseStorySchema: JSONSchema7 = {
  type: "object",
  definitions: {
    MusicRelease: {
      type: "object",
      title: "Musical work",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("MusicRelease"),
        title: { type: "string", title: "Title" },
        artist: { type: "string", title: "Composer" },
        tagline: { type: "string", title: "Tagline" },
        coverArt: { type: "string", title: "Cover art" },
        recording: {
          type: "string",
          format: "uri",
          title: "Recording",
          contentMediaType: "audio/ogg",
        },
        bwv: { type: "string", title: "BWV" },
        releaseYear: { type: "integer", title: "Year" },
        genre: { type: "string", title: "Genre" },
        trackCount: { type: "integer", title: "Movements" },
      },
    },
    SocialProfile: {
      type: "object",
      title: "Social Profile",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("SocialProfile"),
        name: { type: "string", title: "Name" },
        handle: { type: "string", title: "Handle" },
        bio: { type: "string", title: "Bio" },
        avatar: { type: "string", title: "Avatar" },
        banner: { type: "string", title: "Banner" },
        posts: { type: "integer", title: "Posts" },
        followers: { type: "integer", title: "Followers" },
        following: { type: "integer", title: "Following" },
      },
    },
  },
};

export const cardShowcasePrimaryFields: PrimaryFieldDeclaration = {
  MusicRelease: {
    label: "title",
    description: "tagline",
    image: "coverArt",
  },
  SocialProfile: {
    label: "name",
    description: "bio",
    image: "avatar",
  },
};

export const cardShowcasePresentation: CardPresentationRegistry = {
  MusicRelease: {
    variant: "elevated",
    orientation: "vertical",
    size: "standard",
    mediaAspectRatio: "4 / 5",
    mediaOverlay: true,
    secondaryFields: ["bwv", "releaseYear", "genre"],
    hidePropertyLabels: true,
  },
  SocialProfile: {
    variant: "filled",
    orientation: "vertical",
    size: "comfortable",
    banner: "banner",
    secondaryFields: ["posts", "followers", "following"],
    secondaryDisplay: "stats",
    hidePropertyLabels: true,
    actions: [
      { id: "follow", label: "Follow", intent: "custom", primary: true },
    ],
  },
};

export const cardShowcaseTypePresentation: TypePresentationRegistry = {
  MusicRelease: { icon: "🎻", color: "secondary" },
  SocialProfile: { icon: "👤", color: "primary" },
};

export function cardShowcaseTypeNameToTypeIRI(typeName: string): string {
  return `${CARD_SHOWCASE_NS}${typeName}`;
}

export function cardShowcaseTypeIRIToTypeName(iri: string): string | undefined {
  if (!iri.startsWith(CARD_SHOWCASE_NS)) return undefined;
  return iri.slice(CARD_SHOWCASE_NS.length);
}

/**
 * Bach — Fuge (4. Satz) from Violin Sonata No. 1 in G minor, BWV 1001 (1720).
 * Related lute arrangement: Fugue in G minor, BWV 1000.
 * Portrait: Elias Gottlob Haussmann, public domain (Wikimedia Commons).
 * Audio: personal violin recording — `public/fixtures/fuga.ogg`.
 */
export const sampleMusicRelease = {
  "@id": `${CARD_SHOWCASE_NS}work/bwv-1001-fuge`,
  "@type": `${CARD_SHOWCASE_NS}MusicRelease`,
  title: "Fuge g-Moll",
  artist: "Johann Sebastian Bach",
  tagline:
    "Violinsonate Nr. 1 g-Moll, BWV 1001 — 4. Satz (1720, Sei Solo Nr. 1); verwandt mit BWV 1000 (Laute)",
  coverArt: BACH_PORTRAIT_HAUSSMANN_URL,
  recording: FUGA_RECORDING_URL,
  bwv: "BWV 1001",
  releaseYear: 1720,
  genre: "Sonate",
  trackCount: 4,
};

/** Motion-style developer profile card. */
export const sampleSocialProfile = {
  "@id": `${CARD_SHOWCASE_NS}profile/motion-dev`,
  "@type": `${CARD_SHOWCASE_NS}SocialProfile`,
  name: "Motion",
  handle: "@motiondotdev",
  bio: "Free and open source. Create stunning web animations for React, JavaScript and Vue.",
  avatar: "https://avatars.githubusercontent.com/u/104070871?s=200&v=4",
  banner:
    "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80",
  posts: 127,
  followers: 11000,
  following: 5,
};
