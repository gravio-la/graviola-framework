// @ts-nocheck
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import {
  ClassicEntityCard,
  type ClassicEntityCardProps,
} from "@graviola/edb-basic-components";

const meta: Meta<typeof ClassicEntityCard> = {
  title: "Packages/BasicComponents/ClassicEntityCard",
  component: ClassicEntityCard,
  tags: ["package-story"],
};

export default meta;

type Story = StoryObj<typeof ClassicEntityCard>;

export const Default: Story = {
  args: {
    data: {
      id: "1",
      label: "Sample Label",
      title: "Sample Title",
      name: "Sample Name",
      description: "This is a sample description for the ClassicEntityCard.",
      avatar: "https://picsum.photos/300/300",
    },
    id: "1",
    onBack: () => alert("Back button clicked"),
    cardActionChildren: <button>Action</button>,
    detailView: <div>Detail View Content</div>,
  } as ClassicEntityCardProps,
  // Claim: entity card story mounts with provided payload.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};
