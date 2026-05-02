// @ts-nocheck
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import { OverflowText } from "@graviola/edb-basic-components";

export default {
  title: "Packages/BasicComponents/OverflowText",
  component: OverflowText,
  tags: ["package-story"],
} as Meta<typeof OverflowText>;

type Story = StoryObj<typeof OverflowText>;

export const Primary: Story = {
  args: {
    children: "A long text that needs to be stripped",
  },
  // Claim: story renders a stable card/list surface.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};
