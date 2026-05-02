// @ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { AdbSpecialDateFormGroup } from "@graviola/edb-basic-renderer";

export default {
  title: "Packages/FormRenderer/BasicRenderer/AdbSpecialDateFormGroup",
  component: AdbSpecialDateFormGroup,
  tags: ["package-story"],
  argTypes: {
    data: { control: false },
    handleChange: { control: false },
    disabled: { control: "boolean" },
  },
} as Meta<typeof AdbSpecialDateFormGroup>;

const AutocompleteSpecialDateFormGroupStory = ({
  disabled,
}: {
  disabled: boolean;
}) => {
  const [data, setData] = useState<number | undefined>();
  return (
    <AdbSpecialDateFormGroup
      handleChange={setData}
      data={data}
      disabled={disabled}
    />
  );
};

type Story = StoryObj<typeof AdbSpecialDateFormGroup>;

export const AdbSpecialDateFormPrimary: Story = {
  render: (args) => (
    <AutocompleteSpecialDateFormGroupStory disabled={args.disabled} />
  ),
  args: {
    disabled: false,
  },
};
