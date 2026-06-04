import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "@mui/material";
import type { ControlElement } from "@jsonforms/core";
import { SemanticDetailViewNoOps } from "@graviola/semantic-views";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";
import { sampleItem } from "./sharedFixtures";
import { SEMANTIC_VIEWS_EXAMPLE_NS } from "./semanticViewsStorySchema";

const itemWithTags = {
  ...sampleItem,
  tags: [
    {
      "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
      "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/a`,
      name: "Vintage",
      image: "https://picsum.photos/seed/a/120/90",
    },
    {
      "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Tag`,
      "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}tag/b`,
      name: "Sale",
      image: "https://picsum.photos/seed/b/120/90",
    },
  ],
};

const tagsAsCardsUiSchema: ControlElement = {
  type: "Control",
  scope: "#/properties/tags",
  options: { containedAs: "card" },
};

const meta: Meta<typeof SemanticDetailViewNoOps> = {
  title: "semantic-views/Composability",
  component: SemanticDetailViewNoOps,
  decorators: [withSemanticViewsProvider],
};

export default meta;
type Story = StoryObj<typeof SemanticDetailViewNoOps>;

export const DetailWithCardGridChildren: Story = {
  render: () => (
    <Box sx={{ p: 2, maxWidth: 720 }}>
      <SemanticDetailViewNoOps
        typeName="Item"
        data={itemWithTags}
        uiSchema={{
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/name" },
            tagsAsCardsUiSchema,
          ],
        }}
      />
    </Box>
  ),
};
