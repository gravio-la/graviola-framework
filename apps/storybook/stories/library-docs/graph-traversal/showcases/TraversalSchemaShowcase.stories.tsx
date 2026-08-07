import type { Meta, StoryObj } from "@storybook/react";
import { TraversalSchemaShowcase } from "./TraversalSchemaShowcase";

const meta: Meta<typeof TraversalSchemaShowcase> = {
  title: "Library Docs/graph-traversal/Traversal Schema",
  component: TraversalSchemaShowcase,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TraversalSchemaShowcase>;

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
    includeFriends: true,
    friendsLimit: 10,
    maxRecursion: 2,
    omitFields: ["password"],
  },
};
