import type { Meta, StoryObj } from "@storybook/react";
import { SparqlStoreProvider } from "@graviola/sparql-store-provider";
import { withGraviolaProvider } from "../../../.storybook/decorators";

const meta: Meta<typeof SparqlStoreProvider> = {
  component: SparqlStoreProvider,
  title: "Packages/SparqlStoreProvider/SparqlStoreProvider",
  tags: ["package-story", "requires-sparql", "visual-only"],
  decorators: [withGraviolaProvider],
  parameters: {
    test: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof SparqlStoreProvider>;

export const Default: Story = {
  args: {
    endpoint: {
      label: "Oxigraph",
      endpoint: "http://localhost:7878/query",
      provider: "oxigraph",
      active: true,
    },
  },
};

export const Qlever: Story = {
  args: {
    endpoint: {
      label: "Qlever",
      endpoint: "http://localhost:7200/sparql",
      provider: "qlever",
      active: true,
    },
  },
};

export const Allegro: Story = {
  args: {
    endpoint: {
      label: "Allegro",
      endpoint: "http://localhost:7878/sparql",
      provider: "allegro",
      active: true,
    },
  },
};
