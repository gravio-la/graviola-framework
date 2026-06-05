import React, { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "@mui/material";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { defaultValueRenderers } from "@graviola/edb-detail-renderer";
import {
  SemanticTableView,
  composeJsonLdColumns,
  JsonLdTableProvider,
} from "@graviola/edb-table-components";
import { SemanticChipNoOps } from "@graviola/semantic-views";

import type { StoryDomain } from "../../_shared/storyDomains";
import { DomainProvider } from "../../_shared/DomainProvider";
import {
  cellRenderersPrimaryFields,
  cellRenderersStorySchema,
  cellRenderersTypeIRIToTypeName,
  cellRenderersTypeNameToTypeIRI,
  shopItemSamples,
  shopItemTableUiSchema,
} from "../../packages/semantic-views/cellRenderersStorySchema";
import { fiveStarValueRendererEntry } from "../../packages/semantic-views/FiveStarValueRenderer";
import { semanticViewsTypePresentation } from "../../packages/semantic-views/semanticViewsStorySchema";
import { TABLE_CELL_RENDERERS_EXAMPLE_SOURCE } from "./tableCellRenderersExampleSource";

const cellRenderersDomain: StoryDomain = {
  id: "item-catalog",
  label: "Table cell renderers",
  description: "ShopItem showcase for JSON-LD table cell dispatch",
  baseIRI: "http://www.example.org/example/",
  schema: cellRenderersStorySchema,
  primaryFields: cellRenderersPrimaryFields,
  typePresentation: semanticViewsTypePresentation,
  typeNameToTypeIRI: cellRenderersTypeNameToTypeIRI,
  typeIRIToTypeName: cellRenderersTypeIRIToTypeName,
  typeNames: ["ShopItem", "Category", "Tag"],
  defaultTypeName: "ShopItem",
  samples: {
    ShopItem: shopItemSamples as Record<string, unknown>[],
  },
  typeNameLabelMap: {
    ShopItem: "Shop item",
    Category: "Category",
    Tag: "Tag",
  },
};

function readStoryLocale(): string {
  if (typeof window === "undefined") return "en";
  return new URLSearchParams(window.location.search).get("locale") || "en";
}

/** Live preview — mirrors Option A in tableCellRenderersExampleSource.ts */
function TableCellRenderersShowcase() {
  const locale = readStoryLocale();

  const loadedSchema = useMemo(
    () => bringDefinitionToTop(cellRenderersStorySchema, "ShopItem"),
    [],
  );

  const columns = useMemo(
    () =>
      composeJsonLdColumns(loadedSchema, {
        typeName: "ShopItem",
        tableUiSchema: shopItemTableUiSchema,
        t: (key) => key,
        locale,
      }),
    [loadedSchema, locale],
  );

  const columnOrder = useMemo(
    () => columns.map((col) => String(col.id ?? "")).filter(Boolean),
    [columns],
  );

  return (
    <JsonLdTableProvider
      value={{
        ChipComponent: SemanticChipNoOps,
        valueRenderers: [fiveStarValueRendererEntry, ...defaultValueRenderers],
        onShowEntry: (entityIRI) => {
          // eslint-disable-next-line no-console
          console.log("show entry", entityIRI);
        },
        typeIRIToTypeName: cellRenderersTypeIRIToTypeName,
        locale,
      }}
    >
      <Box sx={{ height: 520, display: "flex" }}>
        <SemanticTableView
          typeName="ShopItem"
          columns={columns}
          data={shopItemSamples}
          rowCount={shopItemSamples.length}
          columnOrder={columnOrder}
          pagination={{ pageIndex: 0, pageSize: 10 }}
          onPaginationChange={() => {}}
          sorting={[]}
          onSortingChange={() => {}}
          manualPagination={false}
          locale={locale}
          callbacks={{
            onShowEntry: (id) => {
              // eslint-disable-next-line no-console
              console.log("row action show", id);
            },
          }}
        />
      </Box>
    </JsonLdTableProvider>
  );
}

const meta: Meta<typeof TableCellRenderersShowcase> = {
  title: "Structural Dispatch/Showcases/Table Cell Renderers",
  component: TableCellRenderersShowcase,
  decorators: [
    (Story) => (
      <DomainProvider domain={cellRenderersDomain}>
        <Story />
      </DomainProvider>
    ),
  ],
  tags: ["package-story"],
  parameters: {
    docs: {
      description: {
        component: [
          "JSON-LD tables use **structural dispatch**: `composeJsonLdColumns` walks the schema and picks entries from `jsonLdColumnRegistry` (primitives, dates, nested chips, m-to-m arrays).",
          "",
          "**Value renderers** (`currency`, `dateTime`, custom `fiveStar`) are bound per column in `TableUiSchema` via `options.valueRenderer`. They are injected through `JsonLdTableProvider` (headless) or `SemanticTable`’s `jsonLdCell.extraValueRenderers` prop.",
          "",
          "**Entity chips** reuse the chip registry when you inject `ChipComponent={SemanticChipNoOps}` on the provider or `jsonLdCell` prop.",
          "",
          "Row `data` is JSON-LD-shaped (`@id`, nested `category`, `tags[]`) — not SPARQL flat bindings. Open **Show code** for copy-pasteable Option A (headless) and Option B (`SemanticTable`).",
        ].join("\n"),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableCellRenderersShowcase>;

export const AllCellTypes: Story = {
  render: () => <TableCellRenderersShowcase />,
  parameters: {
    docs: {
      source: {
        type: "code",
        language: "tsx",
        code: TABLE_CELL_RENDERERS_EXAMPLE_SOURCE,
      },
    },
  },
};
