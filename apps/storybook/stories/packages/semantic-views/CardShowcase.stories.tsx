import type { Meta, StoryObj } from "@storybook/react";
import { Box, Stack, Typography } from "@mui/material";
import { SemanticCardNoOps } from "@graviola/semantic-views";

import { withCardShowcaseProvider } from "../../../.storybook/decorators/withCardShowcaseProvider";
import {
  sampleMusicRelease,
  sampleSocialProfile,
} from "./cardShowcaseStorySchema";

const meta: Meta<typeof SemanticCardNoOps> = {
  title: "semantic-views/Card Showcase",
  component: SemanticCardNoOps,
  decorators: [withCardShowcaseProvider],
  parameters: {
    docs: {
      description: {
        component:
          "Material 3 semantic cards driven by schema + primaryFields + cardPresentation — no bespoke layout code per domain.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SemanticCardNoOps>;

export const MusicReleaseCard: Story = {
  name: "Bach Fuga (violin recording)",
  render: () => (
    <Box sx={{ p: 2, maxWidth: 360 }}>
      <SemanticCardNoOps
        typeName="MusicRelease"
        data={sampleMusicRelease}
        motionId={sampleMusicRelease["@id"]}
      />
    </Box>
  ),
};

export const SocialProfileCard: Story = {
  name: "Social profile (banner + stats)",
  render: () => (
    <Box sx={{ p: 2, maxWidth: 360 }}>
      <SemanticCardNoOps
        typeName="SocialProfile"
        data={sampleSocialProfile}
        motionId={sampleSocialProfile["@id"]}
      />
    </Box>
  ),
};

export const SideBySide: Story = {
  name: "Two domains, one architecture",
  render: () => (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={3}
      sx={{ p: 2, alignItems: "stretch" }}
    >
      <Box sx={{ flex: 1, maxWidth: 380 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1 }}>
          Bach · BWV 847
        </Typography>
        <SemanticCardNoOps
          typeName="MusicRelease"
          data={sampleMusicRelease}
          motionId={sampleMusicRelease["@id"]}
        />
      </Box>
      <Box sx={{ flex: 1, maxWidth: 380 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1 }}>
          Profiles / orgs
        </Typography>
        <SemanticCardNoOps
          typeName="SocialProfile"
          data={sampleSocialProfile}
          motionId={sampleSocialProfile["@id"]}
        />
      </Box>
    </Stack>
  ),
};

export const CardGrid: Story = {
  name: "Responsive grid",
  render: () => (
    <Box
      sx={{
        p: 2,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 2,
      }}
    >
      <SemanticCardNoOps
        typeName="MusicRelease"
        data={sampleMusicRelease}
        motionId={`${sampleMusicRelease["@id"]}-a`}
      />
      <SemanticCardNoOps
        typeName="SocialProfile"
        data={sampleSocialProfile}
        motionId={`${sampleSocialProfile["@id"]}-a`}
      />
      <SemanticCardNoOps
        typeName="MusicRelease"
        data={{
          ...sampleMusicRelease,
          "@id": `${sampleMusicRelease["@id"]}/alt`,
          title: "Präludium und Fuge e-Moll",
          bwv: "BWV 855",
          tagline: "Book I — another favourite from the 48",
        }}
        motionId={`${sampleMusicRelease["@id"]}-b`}
      />
    </Box>
  ),
};
