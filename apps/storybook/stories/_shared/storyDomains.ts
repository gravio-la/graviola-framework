import type { JSONSchema7 } from "json-schema";
import type {
  CardPresentationRegistry,
  PrimaryFieldDeclaration,
  TypePresentationRegistry,
} from "@graviola/edb-core-types";
import type { StringToIRIFn, IRIToStringFn } from "@graviola/edb-core-types";

import {
  semanticViewsStorySchema,
  semanticViewsPrimaryFields,
  semanticViewsTypePresentation,
  itemCatalogCardPresentation,
  semanticViewsTypeNameToTypeIRI,
  semanticViewsTypeIRIToTypeName,
  SEMANTIC_VIEWS_EXAMPLE_NS,
} from "../packages/semantic-views/semanticViewsStorySchema";
import {
  sampleItem,
  sampleTag,
} from "../packages/semantic-views/sharedFixtures";
import { WIKIMEDIA } from "../packages/semantic-views/cardShowcaseAudio";
import {
  musicStorySchema,
  musicPrimaryFields,
  musicCardPresentation,
  musicTypePresentation,
  musicTypeNameToTypeIRI,
  musicTypeIRIToTypeName,
  sampleComposerBach,
  sampleMusicalWorkFuga,
  sampleMusicalWorkPrelude,
} from "../packages/semantic-views/musicStorySchema";
import {
  exhibitionStorySchema,
  exhibitionPrimaryFields,
  exhibitionCardPresentation,
  exhibitionTypePresentation,
  exhibitionTypeNameToTypeIRI,
  exhibitionTypeIRIToTypeName,
  sampleExhibition,
  sampleExhibitionPerson,
  sampleExhibitionPlace,
} from "../packages/semantic-views/exhibitionStorySchema";

export type StoryDomainId = "music" | "exhibition" | "item-catalog";

export type StoryDomain = {
  id: StoryDomainId;
  label: string;
  description: string;
  baseIRI: string;
  schema: JSONSchema7;
  primaryFields: PrimaryFieldDeclaration;
  typePresentation?: TypePresentationRegistry;
  cardPresentation?: CardPresentationRegistry;
  typeNameToTypeIRI: StringToIRIFn;
  typeIRIToTypeName: IRIToStringFn;
  typeNames: string[];
  defaultTypeName: string;
  samples: Record<string, Record<string, unknown>[]>;
  typeNameLabelMap?: Record<string, string>;
};

/** Instrument shop fixtures with local photos from public/fixtures/. */
const dashboardSampleItem: Record<string, unknown> = {
  ...sampleItem,
  "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}item/strat-57`,
  name: "Fender Stratocaster '57 Reissue",
  description: "Sunburst finish, maple neck — showroom condition.",
  photos: [WIKIMEDIA.acousticGuitar, WIKIMEDIA.violin],
  tags: [
    {
      "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
      "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/vintage`,
      name: "Vintage",
      description: "Collectible grade",
      image: WIKIMEDIA.studentViolin,
    },
    {
      "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
      "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/sale`,
      name: "On sale",
      image: WIKIMEDIA.clarinet,
    },
  ],
};

const dashboardSampleItemTwo: Record<string, unknown> = {
  ...sampleItem,
  "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}item/yamaha-p125`,
  name: "Yamaha P-125 Digital Piano",
  description: "Compact stage piano — lightly used, with stand.",
  photos: [WIKIMEDIA.digitalPiano],
  tags: [
    {
      "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
      "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/handmade`,
      name: "Handmade",
      description: "Small-batch instruments",
      image: WIKIMEDIA.studentViolin,
    },
  ],
};

const dashboardSampleTag: Record<string, unknown> = {
  ...sampleTag,
  "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/handmade`,
  name: "Handmade",
  description: "Small-batch instruments",
  image: WIKIMEDIA.studentViolin,
};

export const storyDomains: StoryDomain[] = [
  {
    id: "music",
    label: "Music",
    description: "Bach works — schema-driven play action from audio property",
    baseIRI: "http://www.example.org/music/",
    schema: musicStorySchema,
    primaryFields: musicPrimaryFields,
    typePresentation: musicTypePresentation,
    cardPresentation: musicCardPresentation,
    typeNameToTypeIRI: musicTypeNameToTypeIRI,
    typeIRIToTypeName: musicTypeIRIToTypeName,
    typeNames: ["MusicalWork", "Composer"],
    defaultTypeName: "MusicalWork",
    samples: {
      MusicalWork: [sampleMusicalWorkFuga, sampleMusicalWorkPrelude],
      Composer: [sampleComposerBach],
    },
    typeNameLabelMap: { MusicalWork: "Work", Composer: "Composer" },
  },
  {
    id: "exhibition",
    label: "Historic exhibition",
    description: "SLUB exhibition catalog — Otto Dix, Albertinum Dresden",
    baseIRI: "http://ontologies.slub-dresden.de/exhibition/storybook/",
    schema: exhibitionStorySchema,
    primaryFields: exhibitionPrimaryFields,
    typePresentation: exhibitionTypePresentation,
    cardPresentation: exhibitionCardPresentation,
    typeNameToTypeIRI: exhibitionTypeNameToTypeIRI,
    typeIRIToTypeName: exhibitionTypeIRIToTypeName,
    typeNames: ["Exhibition", "Person", "Place", "Tag"],
    defaultTypeName: "Exhibition",
    samples: {
      Exhibition: [sampleExhibition],
      Person: [sampleExhibitionPerson],
      Place: [sampleExhibitionPlace],
      Tag: [
        {
          "@id": `${exhibitionTypeNameToTypeIRI("Tag")}/ww1`,
          "@type": exhibitionTypeNameToTypeIRI("Tag"),
          name: "Erster Weltkrieg",
          description: "Jubiläumsausstellung",
        },
      ],
    },
    typeNameLabelMap: {
      Exhibition: "Exhibition",
      Person: "Person",
      Place: "Place",
      Tag: "Tag",
    },
  },
  {
    id: "item-catalog",
    label: "Item catalog",
    description: "Music-instrument shop — Item, Tag (testapp domain)",
    baseIRI: SEMANTIC_VIEWS_EXAMPLE_NS,
    schema: semanticViewsStorySchema,
    primaryFields: semanticViewsPrimaryFields,
    typePresentation: semanticViewsTypePresentation,
    cardPresentation: itemCatalogCardPresentation,
    typeNameToTypeIRI: semanticViewsTypeNameToTypeIRI,
    typeIRIToTypeName: semanticViewsTypeIRIToTypeName,
    typeNames: ["Item", "Tag"],
    defaultTypeName: "Item",
    samples: {
      Item: [dashboardSampleItem, dashboardSampleItemTwo],
      Tag: [dashboardSampleTag],
    },
    typeNameLabelMap: { Item: "Item", Tag: "Tag" },
  },
];

export function getStoryDomain(id: StoryDomainId): StoryDomain {
  const domain = storyDomains.find((d) => d.id === id);
  if (!domain) {
    throw new Error(`Unknown story domain: ${id}`);
  }
  return domain;
}

/** Flat rows for SemanticTableView previews (label from primaryFields). */
export function buildTablePreviewRows(
  domain: StoryDomain,
): { "@id": string; name: string; kind: string }[] {
  return domain.typeNames.flatMap((typeName) => {
    const labelField = domain.primaryFields[typeName]?.label ?? "name";
    return (domain.samples[typeName] ?? []).map((row) => ({
      "@id": String(row["@id"] ?? ""),
      name: String((row as Record<string, unknown>)[labelField] ?? typeName),
      kind: typeName,
    }));
  });
}
