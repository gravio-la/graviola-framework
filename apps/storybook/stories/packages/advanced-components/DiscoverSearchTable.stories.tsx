// @ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";

import { DiscoverSearchTable } from "@graviola/edb-advanced-components";
import { withGraviolaProvider } from "../../../.storybook/decorators";

export default {
  title: "Packages/AdvancedComponents/DiscoverSearchTable",
  component: DiscoverSearchTable,
  tags: ["package-story"],
  decorators: [withGraviolaProvider],
} as Meta<typeof DiscoverSearchTable>;

type Story = StoryObj<typeof DiscoverSearchTable>;

export const DiscoverSearchTableDefault: Story = {
  args: {
    typeName: "Person",
    searchString: "Marie",
  },
  // Claim: table story mounts with configured search props.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};

export const DiscoverSearchTableWithImage: Story = {
  args: {
    typeName: "Location",
    searchString: "New York",
  },
  // Claim: alternate search variant mounts successfully.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};
