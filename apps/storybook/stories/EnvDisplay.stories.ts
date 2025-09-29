import type { Meta, StoryObj } from "@storybook/react";
import { EnvDisplay } from "./EnvDisplay";

const meta: Meta<typeof EnvDisplay> = {
  title: "Example/EnvDisplay",
  component: EnvDisplay,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    envVarName: {
      control: "text",
      description: "Name of the environment variable to display",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    envVarName: "STORYBOOK_BASE_PATH",
  },
};

export const NextPublicPrefix: Story = {
  args: {
    envVarName: "NEXT_PUBLIC_BASE_PATH",
  },
};

export const VitePrefix: Story = {
  args: {
    envVarName: "VITE_BASE_PATH",
  },
};

export const CustomVariable: Story = {
  args: {
    envVarName: "STORYBOOK_CUSTOM_VAR",
  },
};
