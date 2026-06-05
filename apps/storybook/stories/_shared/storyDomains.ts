import type { JSONSchema7 } from "json-schema";
import type {
  PrimaryFieldDeclaration,
  TypePresentationRegistry,
} from "@graviola/edb-core-types";
import type { StringToIRIFn, IRIToStringFn } from "@graviola/edb-core-types";

import {
  semanticViewsStorySchema,
  semanticViewsPrimaryFields,
  semanticViewsTypePresentation,
  semanticViewsTypeNameToTypeIRI,
  semanticViewsTypeIRIToTypeName,
  SEMANTIC_VIEWS_EXAMPLE_NS,
} from "../packages/semantic-views/semanticViewsStorySchema";
import {
  sampleItem,
  sampleTag,
} from "../packages/semantic-views/sharedFixtures";

/** Richer catalog fixture for the welcome dashboard (images, tags, multiple photos). */
const dashboardSampleItem: Record<string, unknown> = {
  ...sampleItem,
  name: "Fender Stratocaster '57 Reissue",
  description: "Sunburst finish, maple neck — showroom condition.",
  photos: [
    "https://picsum.photos/seed/strat-main/480/360",
    "https://picsum.photos/seed/strat-detail/480/360",
  ],
  tags: [
    {
      "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
      "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/vintage`,
      name: "Vintage",
      description: "Collectible grade",
      image: "https://picsum.photos/seed/tag-vintage/200/150",
    },
    {
      "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
      "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/sale`,
      name: "On sale",
      image: "https://picsum.photos/seed/tag-sale/200/150",
    },
  ],
};

const dashboardSampleTag: Record<string, unknown> = {
  ...sampleTag,
  name: "Handmade",
  description: "Small-batch instruments",
  image: "https://picsum.photos/seed/tag-handmade/400/280",
};
import {
  valueRenderersStorySchema,
  valueRenderersPrimaryFields,
  valueRenderersTypeNameToTypeIRI,
  valueRenderersTypeIRIToTypeName,
  sampleProduct,
} from "../packages/semantic-views/valueRenderersStorySchema";
import {
  relationChipsStorySchema,
  relationChipsPrimaryFields,
  relationChipsTypeNameToTypeIRI,
  relationChipsTypeIRIToTypeName,
  sampleManifestationWithRelations,
  SEMANTIC_VIEWS_EXAMPLE_NS as RELATION_NS,
} from "../packages/semantic-views/relationChipsStorySchema";

export type StoryDomainId = "item-catalog" | "product" | "relations";

export type StoryDomain = {
  id: StoryDomainId;
  label: string;
  description: string;
  baseIRI: string;
  schema: JSONSchema7;
  primaryFields: PrimaryFieldDeclaration;
  typePresentation?: TypePresentationRegistry;
  typeNameToTypeIRI: StringToIRIFn;
  typeIRIToTypeName: IRIToStringFn;
  /** Entity types available in this domain (definition keys). */
  typeNames: string[];
  /** Default type for previews when the domain loads. */
  defaultTypeName: string;
  /** Inline JSON-LD-shaped instances keyed by typeName. */
  samples: Record<string, Record<string, unknown>[]>;
  /** Ordered types for chips/cards/lists gallery previews; defaults to typeNames. */
  galleryTypeNames?: string[];
  typeNameLabelMap?: Record<string, string>;
};

export type GalleryEntity = {
  typeName: string;
  entityIRI: string;
  data: Record<string, unknown>;
};

const sampleRealm = {
  "@type": `${RELATION_NS}Realm`,
  "@id": `${RELATION_NS}realm/75`,
  realmName: "Workstation NAS",
};

const sampleArtifact = {
  "@type": `${RELATION_NS}Artifact`,
  "@id": `${RELATION_NS}artifact/abc123`,
  documentTitle: "Album cover image",
};

export const storyDomains: StoryDomain[] = [
  {
    id: "item-catalog",
    label: "Item catalog",
    description: "Music-instrument shop: Item, Tag",
    baseIRI: SEMANTIC_VIEWS_EXAMPLE_NS,
    schema: semanticViewsStorySchema,
    primaryFields: semanticViewsPrimaryFields,
    typePresentation: semanticViewsTypePresentation,
    typeNameToTypeIRI: semanticViewsTypeNameToTypeIRI,
    typeIRIToTypeName: semanticViewsTypeIRIToTypeName,
    typeNames: ["Item", "Tag"],
    defaultTypeName: "Item",
    samples: {
      Item: [
        dashboardSampleItem,
        {
          ...dashboardSampleItem,
          "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}item/me80`,
          name: "Boss ME-80 Multi-Effects",
          description: "Gig-ready pedalboard in a box.",
          tags: [dashboardSampleTag],
        },
      ],
      Tag: [dashboardSampleTag],
    },
    typeNameLabelMap: { Item: "Item", Tag: "Tag" },
  },
  {
    id: "product",
    label: "Product (value renderers)",
    description: "Scalars with currency and historical date formatters",
    baseIRI: SEMANTIC_VIEWS_EXAMPLE_NS,
    schema: valueRenderersStorySchema,
    primaryFields: valueRenderersPrimaryFields,
    typeNameToTypeIRI: valueRenderersTypeNameToTypeIRI,
    typeIRIToTypeName: valueRenderersTypeIRIToTypeName,
    typeNames: ["Product"],
    defaultTypeName: "Product",
    samples: {
      Product: [sampleProduct as Record<string, unknown>],
    },
    typeNameLabelMap: { Product: "Product" },
  },
  {
    id: "relations",
    label: "Realm / Artifact / Manifestation",
    description: "Semantic desk relations and nested entity chips",
    baseIRI: RELATION_NS,
    schema: relationChipsStorySchema,
    primaryFields: relationChipsPrimaryFields,
    typeNameToTypeIRI: relationChipsTypeNameToTypeIRI,
    typeIRIToTypeName: relationChipsTypeIRIToTypeName,
    typeNames: ["Manifestation", "Realm", "Artifact"],
    defaultTypeName: "Manifestation",
    samples: {
      Manifestation: [
        sampleManifestationWithRelations as Record<string, unknown>,
      ],
      Realm: [sampleRealm as Record<string, unknown>],
      Artifact: [sampleArtifact as Record<string, unknown>],
    },
    typeNameLabelMap: {
      Manifestation: "Manifestation",
      Realm: "Realm",
      Artifact: "Artifact",
    },
  },
];

export function getStoryDomain(id: StoryDomainId): StoryDomain {
  const domain = storyDomains.find((d) => d.id === id);
  if (!domain) {
    throw new Error(`Unknown story domain: ${id}`);
  }
  return domain;
}

/** Resolve gallery preview entities for chips/cards/lists on the welcome dashboard. */
export function getGalleryEntities(
  domain: StoryDomain,
  max = 3,
): GalleryEntity[] {
  const order = domain.galleryTypeNames ?? domain.typeNames;
  return order
    .map((typeName) => {
      const data = domain.samples[typeName]?.[0];
      if (!data) return null;
      return {
        typeName,
        entityIRI: String(data["@id"] ?? ""),
        data,
      };
    })
    .filter((e): e is GalleryEntity => e != null)
    .slice(0, max);
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
