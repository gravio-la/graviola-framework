import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Box, Typography } from "@mui/material";
import { rankWith, optionIs } from "@jsonforms/core";
import type {
  ValueRendererEntry,
  ValueRendererProps,
} from "@graviola/edb-detail-renderer-core";
import {
  SemanticChipNoOps,
  SemanticDetailViewNoOps,
  SemanticListItemNoOps,
} from "@graviola/semantic-views";
import type { JSONSchema7 } from "json-schema";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";
import {
  productChipUiSchema,
  productDetailUiSchema,
  productListItemUiSchema,
  sampleProduct,
} from "./valueRenderersStorySchema";

/** Flat Product schema (same shape as OptionsDetailScoping stories). */
const flatProductSchema: JSONSchema7 = {
  type: "object",
  properties: {
    name: { type: "string" },
    price: { type: "integer" },
    historicalStart: {
      type: "object",
      properties: { year: { type: "integer" } },
    },
    recordedAt: { type: "string", format: "date-time" },
  },
};

const flatSampleProduct = {
  name: sampleProduct.name,
  price: sampleProduct.price,
  historicalStart: sampleProduct.historicalStart,
  recordedAt: sampleProduct.recordedAt,
};

function CallNumberRenderer({ value }: ValueRendererProps) {
  return (
    <Typography
      variant="inherit"
      component="span"
      sx={{ fontFamily: "monospace" }}
    >
      📞 {String(value ?? "")}
    </Typography>
  );
}

const callNumberOverride: ValueRendererEntry = {
  name: "callNumber",
  tester: rankWith(10, optionIs("valueRenderer", "callNumber")),
  renderer: CallNumberRenderer as ValueRendererEntry["renderer"],
};

const meta: Meta = {
  title: "semantic-views/ValueRenderers",
  decorators: [withSemanticViewsProvider],
};

export default meta;
type Story = StoryObj;

export const CurrencyInDetail: Story = {
  render: () => (
    <Box sx={{ p: 2, maxWidth: 480 }}>
      <SemanticDetailViewNoOps
        data={flatSampleProduct}
        schema={flatProductSchema}
        uiSchema={productDetailUiSchema}
      />
    </Box>
  ),
};

export const IsoDateTimeInDetail: Story = {
  render: () => (
    <Box sx={{ p: 2, maxWidth: 480 }}>
      <SemanticDetailViewNoOps
        data={flatSampleProduct}
        schema={flatProductSchema}
        uiSchema={{
          type: "TopLevelLayout",
          elements: [
            {
              type: "VerticalLayout",
              elements: [
                {
                  type: "Control",
                  scope: "#/properties/recordedAt",
                  label: "Recorded at",
                },
              ],
            },
          ],
        }}
      />
    </Box>
  ),
};

export const CurrencyInChip: Story = {
  render: () => (
    <SemanticChipNoOps
      data={flatSampleProduct}
      schema={flatProductSchema}
      uiSchema={productChipUiSchema}
    />
  ),
};

export const HistoricalDateInList: Story = {
  render: () => (
    <SemanticListItemNoOps
      data={flatSampleProduct}
      schema={flatProductSchema}
      uiSchema={productListItemUiSchema}
    />
  ),
};

const callNumberUiSchema = {
  type: "ChipLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/name",
      options: { valueRenderer: "callNumber" },
    },
  ],
} as const;

export const CustomOverride: Story = {
  render: () => (
    <SemanticChipNoOps
      data={{ ...flatSampleProduct, name: "MS-42/7" }}
      schema={flatProductSchema}
      uiSchema={callNumberUiSchema}
      config={{ overrideValueRenderers: [callNumberOverride] }}
    />
  ),
};
