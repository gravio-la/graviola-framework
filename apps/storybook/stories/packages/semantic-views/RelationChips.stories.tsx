import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "@mui/material";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { SemanticDetailViewNoOps } from "@graviola/semantic-views";
import { withRelationChipsProvider } from "../../../.storybook/decorators/withRelationChipsProvider";
import {
  manifestationRelationDetailUiSchema,
  relationChipsPrimaryFields,
  relationChipsStorySchema,
  sampleManifestationWithRelations,
  SEMANTIC_VIEWS_EXAMPLE_NS,
} from "./relationChipsStorySchema";

const manifestationTypeSchema = bringDefinitionToTop(
  relationChipsStorySchema,
  "Manifestation",
);

const meta: Meta = {
  title: "semantic-views/RelationChips",
  decorators: [withRelationChipsProvider],
  parameters: {
    docs: {
      description: {
        component:
          "Schema-typed relations (`@type` in JSON Schema) render as chips in detail views. Named nodes (`@id`) are clickable and dispatch show-entity intent.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ManifestationRelations: Story = {
  render: () => (
    <Box sx={{ p: 2, maxWidth: 560 }}>
      <SemanticDetailViewNoOps
        typeName="Manifestation"
        data={sampleManifestationWithRelations}
        schema={manifestationTypeSchema}
        uiSchema={manifestationRelationDetailUiSchema}
        config={{ primaryFields: relationChipsPrimaryFields }}
      />
    </Box>
  ),
};

export const TypedNodeWithoutId: Story = {
  render: () => (
    <Box sx={{ p: 2, maxWidth: 560 }}>
      <SemanticDetailViewNoOps
        typeName="Manifestation"
        data={{
          ...sampleManifestationWithRelations,
          inRealm: {
            "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Realm`,
            realmName: "Embedded realm (no @id)",
          },
        }}
        schema={manifestationTypeSchema}
        uiSchema={{
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/inRealm",
              label: "In Realm",
              options: { containedAs: "chip" },
            },
          ],
        }}
        config={{ primaryFields: relationChipsPrimaryFields }}
      />
    </Box>
  ),
};
