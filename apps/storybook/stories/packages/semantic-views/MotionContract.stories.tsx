import type { Meta, StoryObj } from "@storybook/react";
import { Box, Typography } from "@mui/material";
import {
  NoopMotionAdapter,
  SemanticChipNoOps,
  useMotionAdapter,
} from "@graviola/semantic-views";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";
import { withMotionAdapter } from "../../../.storybook/decorators/withMotionAdapter";
import { sampleItem } from "./sharedFixtures";

function SlotProbe() {
  const adapter = useMotionAdapter();
  return (
    <Typography variant="caption" color="text.secondary">
      Motion adapter:{" "}
      {adapter === NoopMotionAdapter ? "NoopMotionAdapter" : "custom"}
    </Typography>
  );
}

const meta: Meta<typeof SemanticChipNoOps> = {
  title: "semantic-views/MotionContract",
  component: SemanticChipNoOps,
  decorators: [withSemanticViewsProvider, withMotionAdapter(NoopMotionAdapter)],
};

export default meta;
type Story = StoryObj<typeof SemanticChipNoOps>;

export const ChipSlotsBaseline: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <SlotProbe />
      <SemanticChipNoOps
        typeName="Item"
        data={sampleItem}
        motionId={sampleItem["@id"] as string}
        motionScope="story"
      />
    </Box>
  ),
};
