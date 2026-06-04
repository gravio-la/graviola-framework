import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "@mui/material";
import type { JSONSchema7 } from "json-schema";
import { SemanticDetailViewNoOps } from "@graviola/semantic-views";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";

/** FlatNestedEntity-style schema from the semantic views plan (§5). */
const flatNestedSchema: JSONSchema7 = {
  type: "object",
  properties: {
    name: { type: "string" },
    image: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          image: { type: "string" },
          subItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                image: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

const flatNestedData = {
  name: "Entity root",
  image: "https://picsum.photos/seed/root/200/120",
  items: [
    {
      name: "Item 1",
      image: "https://picsum.photos/seed/i1/120/80",
      subItems: [
        { name: "Sub 1", image: "https://picsum.photos/seed/s1/80/60" },
      ],
    },
  ],
};

const meta: Meta<typeof SemanticDetailViewNoOps> = {
  title: "semantic-views/OptionsDetailScoping",
  component: SemanticDetailViewNoOps,
  decorators: [withSemanticViewsProvider],
};

export default meta;
type Story = StoryObj<typeof SemanticDetailViewNoOps>;

export const FlatNestedEntity: Story = {
  render: () => (
    <Box sx={{ p: 2, maxWidth: 640 }}>
      <SemanticDetailViewNoOps
        data={flatNestedData}
        schema={flatNestedSchema}
        uiSchema={{
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/name" },
            { type: "Control", scope: "#/properties/image" },
            {
              type: "Control",
              scope: "#/properties/items",
              options: {
                detail: {
                  type: "VerticalLayout",
                  elements: [
                    { type: "Control", scope: "#/properties/name" },
                    { type: "Control", scope: "#/properties/image" },
                    {
                      type: "Control",
                      scope: "#/properties/subItems",
                      options: {
                        detail: {
                          type: "VerticalLayout",
                          elements: [
                            { type: "Control", scope: "#/properties/name" },
                            { type: "Control", scope: "#/properties/image" },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        }}
      />
    </Box>
  ),
};
