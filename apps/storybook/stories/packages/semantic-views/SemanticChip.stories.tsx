import type { Meta, StoryObj } from "@storybook/react";
import { SemanticChipNoOps } from "@graviola/semantic-views";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";
import { sampleItem } from "./sharedFixtures";

const meta: Meta<typeof SemanticChipNoOps> = {
  title: "semantic-views/SemanticChip",
  component: SemanticChipNoOps,
  decorators: [withSemanticViewsProvider],
};

export default meta;
type Story = StoryObj<typeof SemanticChipNoOps>;

export const Default: Story = {
  args: {
    typeName: "Item",
    data: sampleItem,
  },
};
