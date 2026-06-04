import { SEMANTIC_VIEWS_EXAMPLE_NS } from "./semanticViewsStorySchema";

export const sampleItem = {
  "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Item`,
  "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}item/1`,
  name: "Sample item",
  description: "A demo item for semantic view stories",
  photos: ["https://picsum.photos/seed/item/200/150"],
};

export const sampleTag = {
  "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
  "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/1`,
  name: "Vintage",
  description: "Second-hand quality",
  image: "https://picsum.photos/seed/tag/200/150",
};
