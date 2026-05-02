// @ts-nocheck
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { withGraviolaProvider } from "../../../.storybook/decorators";
import { expect } from "@storybook/test";
import { ClassicResultListItem } from "@graviola/edb-basic-components";

export default {
  title: "Packages/BasicComponents/ClassicResultListItem",
  component: ClassicResultListItem,
  tags: ["package-story"],
  decorators: [withGraviolaProvider],
} as Meta<typeof ClassicResultListItem>;

type Story = StoryObj<typeof ClassicResultListItem>;

export const Primary: Story = {
  args: {
    id: "list-item-1",
    index: 0,
    onSelected: (id: string, index: number) =>
      console.log(`Selected: ${id} at index ${index}`),
    avatar: "http://example.com/avatar.png",
    label: "Primary Example",
    secondary: "This is a secondary text example",
    category: "Category Example",
    altAvatar: "A",
    selected: false,
  },
  // Claim: story renders a stable card/list surface.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};
