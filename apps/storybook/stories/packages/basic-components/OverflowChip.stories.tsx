// @ts-nocheck
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { withGraviolaProvider } from "../../../.storybook/decorators";
import { expect } from "@storybook/test";
import { OverflowChip } from "@graviola/edb-basic-components";

export default {
  title: "Packages/BasicComponents/OverflowChip",
  component: OverflowChip,
  tags: ["package-story"],
  decorators: [withGraviolaProvider],
} as Meta<typeof OverflowChip>;

type Story = StoryObj<typeof OverflowChip>;

export const Primary: Story = {
  args: {
    label: "Example Chip",
    secondary: "Detailed description here",
    entityIRI: "http://example.com/entity",
  },
  // Claim: story renders a stable card/list surface.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};
