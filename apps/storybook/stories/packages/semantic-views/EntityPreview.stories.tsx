import type { Meta, StoryObj } from "@storybook/react";
import { Box, Stack, Typography } from "@mui/material";
import { extractEntityPreview } from "@graviola/edb-core-utils";
import { useEntityPreview } from "@graviola/semantic-views";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";
import {
  semanticViewsPrimaryFields,
  semanticViewsTypePresentation,
} from "./semanticViewsStorySchema";
import { withViewConfig } from "../../../.storybook/decorators/withViewConfig";
import { sampleItem } from "./sharedFixtures";

function PreviewPanel({ typeName }: { typeName: string }) {
  const hookPreview = useEntityPreview(sampleItem, { typeName });
  const purePreview = extractEntityPreview({
    data: sampleItem,
    typeName,
    primaryFields: semanticViewsPrimaryFields,
    typePresentation: semanticViewsTypePresentation,
  });
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">useEntityPreview</Typography>
      <pre>{JSON.stringify(hookPreview, null, 2)}</pre>
      <Typography variant="subtitle2">
        extractEntityPreview (with typePresentation)
      </Typography>
      <pre>{JSON.stringify(purePreview, null, 2)}</pre>
    </Stack>
  );
}

const meta: Meta = {
  title: "semantic-views/EntityPreview",
  decorators: [withSemanticViewsProvider],
};

export default meta;
type Story = StoryObj;

export const WithTypePresentation: Story = {
  decorators: [
    withViewConfig({
      detail: {},
    }),
  ],
  render: () => (
    <Box sx={{ p: 2, maxWidth: 480 }}>
      <PreviewPanel typeName="Item" />
    </Box>
  ),
};

export const WithoutTypePresentation: Story = {
  render: () => (
    <Box sx={{ p: 2, maxWidth: 480 }}>
      <PreviewPanel typeName="Item" />
    </Box>
  ),
};
