import type { Meta, StoryObj } from "@storybook/react";
import { NormalizerShowcase } from "./NormalizerShowcase";

const meta: Meta<typeof NormalizerShowcase> = {
  title: "Library Docs/graph-traversal/Normalizer",
  component: NormalizerShowcase,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof NormalizerShowcase>;

export const WithReferences: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        friends: {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
      },
      $defs: {
        Person: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
        },
      },
    },
    includeFriends: true,
    friendsLimit: 10,
    maxRecursion: 4,
    omitFields: [],
  },
};

export const CircularReferences: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        knows: {
          type: "array",
          items: { $ref: "#" },
        },
      },
    },
    includeFriends: false,
    friendsLimit: 5,
    maxRecursion: 3,
    omitFields: [],
  },
};

export const WithFilters: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        age: { type: "number" },
      },
    },
    includeFriends: false,
    friendsLimit: 10,
    maxRecursion: 2,
    omitFields: ["password"],
  },
};
