import type { Meta, StoryObj } from "@storybook/react";
import { SemanticCardNoOps } from "@graviola/semantic-views";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";
import { sampleItem, sampleTag } from "./sharedFixtures";

const meta: Meta<typeof SemanticCardNoOps> = {
  title: "semantic-views/SemanticCard",
  component: SemanticCardNoOps,
  decorators: [withSemanticViewsProvider],
};

export default meta;
type Story = StoryObj<typeof SemanticCardNoOps>;

export const Default: Story = {
  args: { typeName: "Item", data: sampleItem },
};

export const WithImage: Story = {
  args: { typeName: "Tag", data: sampleTag },
};
