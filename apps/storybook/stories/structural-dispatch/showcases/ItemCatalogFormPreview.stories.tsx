import type { Meta, StoryObj } from "@storybook/react";
import { sampleItem } from "../../packages/semantic-views/sharedFixtures";
import { getStoryDomain } from "../../_shared/storyDomains";
import {
  DomainProvider,
  DashboardFormPreview,
} from "../../_shared/DomainProvider";

const domain = getStoryDomain("item-catalog");

const meta: Meta<typeof DashboardFormPreview> = {
  title: "Structural Dispatch/Showcases/Item Catalog Form",
  component: DashboardFormPreview,
  decorators: [
    (Story) => (
      <DomainProvider domain={domain}>
        <Story />
      </DomainProvider>
    ),
  ],
  tags: ["package-story"],
};

export default meta;
type Story = StoryObj<typeof DashboardFormPreview>;

export const Default: Story = {
  args: {
    typeName: "Item",
    data: sampleItem as Record<string, unknown>,
  },
};
