import type { Meta, StoryObj } from "@storybook/react";
import { SemanticDetailViewNoOps } from "@graviola/semantic-views";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";
import { withViewConfig } from "../../../.storybook/decorators/withViewConfig";
import { sampleItem } from "./sharedFixtures";

const meta: Meta<typeof SemanticDetailViewNoOps> = {
  title: "semantic-views/SemanticDetailView",
  component: SemanticDetailViewNoOps,
  decorators: [withSemanticViewsProvider],
};

export default meta;
type Story = StoryObj<typeof SemanticDetailViewNoOps>;

export const Default: Story = {
  args: { typeName: "Item", data: sampleItem },
};

export const OverrideViaViewConfig: Story = {
  decorators: [
    withViewConfig({
      detail: {
        options: { hideHeaderPrimaryFields: true },
      },
    }),
  ],
  args: { typeName: "Item", data: sampleItem },
};
