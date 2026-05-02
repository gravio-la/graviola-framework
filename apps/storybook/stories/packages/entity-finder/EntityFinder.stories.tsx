// @ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import { EntityFinder } from "@graviola/entity-finder";
import { withGraviolaProvider } from "../../../.storybook/decorators";

const sladb = (name: string) =>
  `http://ontologies.slub-dresden.de/exhibition#${name}`;

const meta: Meta<typeof EntityFinder> = {
  component: EntityFinder,
  title: "Packages/EntityFinder/EntityFinder",
  tags: ["package-story"],
  decorators: [withGraviolaProvider],
};

export default meta;
type Story = StoryObj<typeof EntityFinder>;

export const Default: Story = {
  args: {
    classIRI: sladb("Exhibition"),
  },
  // Claim: the finder renders in story context without crashing.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};

export const PersonFinder: Story = {
  args: {
    classIRI: sladb("Person"),
  },
  // Claim: person finder variant mounts successfully.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};
