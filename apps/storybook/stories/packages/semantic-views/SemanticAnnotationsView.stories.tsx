import type { Meta, StoryObj } from "@storybook/react";
import {
  SemanticAnnotationsView,
  SemanticDetailViewNoOps,
} from "@graviola/semantic-views";
import {
  baseMetaSchemaProfile,
  composeMetaSchemaProfile,
} from "@graviola/meta-schema";
import { Box } from "@mui/material";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";
import { sampleItem } from "./sharedFixtures";

const lifecycleMetaSchema = composeMetaSchemaProfile({
  includeLifecycle: true,
});

const meta: Meta<typeof SemanticAnnotationsView> = {
  title: "semantic-views/SemanticAnnotationsView",
  component: SemanticAnnotationsView,
  decorators: [withSemanticViewsProvider],
};

export default meta;
type Story = StoryObj<typeof SemanticAnnotationsView>;

export const ItemLifecycleAndFingerprint: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720, p: 2 }}>
      <SemanticDetailViewNoOps typeName="Item" data={sampleItem} />
      <SemanticAnnotationsView
        meta={{
          created: "2026-07-09T08:15:00.000Z",
          modified: "2026-07-10T09:30:00.000Z",
          schemaFingerprint: "sha256:demo-fingerprint",
          schemaVersion: "1.0.0",
        }}
        metaSchema={lifecycleMetaSchema}
        title="Metadaten"
      />
    </Box>
  ),
};

export const ExtendedProfile: Story = {
  args: {
    meta: {
      created: "2026-07-09T08:15:00.000Z",
      modified: "2026-07-10T09:30:00.000Z",
      schemaFingerprint: "sha256:demo-fingerprint",
      reviewStatus: "approved",
    },
    metaSchema: baseMetaSchemaProfile,
    title: "Entity metadata",
  },
};
