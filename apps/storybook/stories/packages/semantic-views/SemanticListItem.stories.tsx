import type { Meta, StoryObj } from "@storybook/react";
import { SemanticListItemNoOps } from "@graviola/semantic-views";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";
import { sampleItem } from "./sharedFixtures";

const meta: Meta<typeof SemanticListItemNoOps> = {
  title: "semantic-views/SemanticListItem",
  component: SemanticListItemNoOps,
  decorators: [withSemanticViewsProvider],
};

export default meta;
type Story = StoryObj<typeof SemanticListItemNoOps>;

export const Default: Story = {
  args: { typeName: "Item", data: sampleItem },
};
