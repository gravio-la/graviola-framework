import type { JSONSchema7 } from "json-schema";
import type {
  CardPresentationRegistry,
  PrimaryFieldDeclaration,
  TypePresentationRegistry,
} from "@graviola/edb-core-types";

export const SEMANTIC_VIEWS_EXAMPLE_NS = "http://www.example.org/example/";

const typeConst = (name: string) => ({
  type: "string" as const,
  const: `${SEMANTIC_VIEWS_EXAMPLE_NS}${name}`,
});

/** Minimal item-catalog schema for semantic-views stories (matches testapp item-schema IRIs). */
export const semanticViewsStorySchema: JSONSchema7 = {
  type: "object",
  definitions: {
    Item: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Item"),
        name: { type: "string" },
        description: { type: "string" },
        photos: { type: "array", items: { type: "string" } },
        tags: {
          type: "array",
          items: { $ref: "#/definitions/Tag" },
        },
      },
    },
    Tag: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Tag"),
        name: { type: "string" },
        description: { type: "string" },
        image: { type: "string" },
      },
    },
  },
};

export const semanticViewsPrimaryFields: PrimaryFieldDeclaration = {
  Item: {
    label: "name",
    description: "description",
    image: "photos",
  },
  Tag: {
    label: "name",
    description: "description",
    image: "image",
  },
};

export const semanticViewsTypePresentation: TypePresentationRegistry = {
  Item: { icon: "🎸", color: "primary" },
  Tag: { icon: "🏷️", color: "secondary" },
};

export const itemCatalogCardPresentation: CardPresentationRegistry = {
  Item: {
    variant: "elevated",
    orientation: "vertical",
    size: "standard",
    mediaAspectRatio: "4 / 3",
    secondaryFields: ["description"],
    hidePropertyLabels: true,
    actions: [{ id: "show", label: "View", intent: "show", primary: true }],
  },
  Tag: {
    variant: "outlined",
    orientation: "vertical",
    size: "compact",
    hidePropertyLabels: true,
  },
};

export function semanticViewsTypeNameToTypeIRI(typeName: string): string {
  return `${SEMANTIC_VIEWS_EXAMPLE_NS}${typeName}`;
}

export function semanticViewsTypeIRIToTypeName(
  iri: string,
): string | undefined {
  if (!iri.startsWith(SEMANTIC_VIEWS_EXAMPLE_NS)) return undefined;
  return iri.slice(SEMANTIC_VIEWS_EXAMPLE_NS.length);
}
