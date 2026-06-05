/**
 * Shown in Storybook Docs → Show code. Kept as a string so readers get a
 * copy-pasteable integration guide, not `<TableCellRenderersShowcase />`.
 */
export const TABLE_CELL_RENDERERS_EXAMPLE_SOURCE = `import { useMemo } from "react";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import type { TableUiSchema } from "@graviola/edb-table-types";
import {
  VALUE_RENDERER_OPTION,
  VALUE_RENDERER_OPTIONS_KEY,
} from "@graviola/edb-detail-renderer-core";
import { defaultValueRenderers } from "@graviola/edb-detail-renderer";
import {
  SemanticTable,
  SemanticTableView,
  composeJsonLdColumns,
  JsonLdTableProvider,
} from "@graviola/edb-table-components";
import { SemanticChipNoOps } from "@graviola/semantic-views";
import type { ValueRendererEntry } from "@graviola/edb-detail-renderer-core";
import { Rating } from "@mui/material";

// --- Custom value renderer (optional; same registry as detail views) ---
const fiveStarValueRendererEntry: ValueRendererEntry = {
  name: "fiveStar",
  tester: () => -1,
  renderer: ({ value }) => (
    <Rating value={Number(value)} max={5} readOnly size="small" />
  ),
};

// --- 1. JSON Schema: property *shape* drives default cell dispatch ---
//     string → text, format:"date-time" → date renderer, $ref object → chip,
//     array of $ref → m-to-m chip row. Override per column via TableUiSchema.
const schema = {
  type: "object",
  definitions: {
    ShopItem: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string", const: "http://example.org/ShopItem" },
        name: { type: "string" },
        category: { $ref: "#/definitions/Category" },
        rating: { type: "integer" },
        price: { type: "integer" },
        releasedAt: { type: "string", format: "date-time" },
        tags: { type: "array", items: { $ref: "#/definitions/Tag" } },
      },
    },
    Category: { type: "object", properties: { "@id": { type: "string" }, name: { type: "string" } } },
    Tag: { type: "object", properties: { "@id": { type: "string" }, name: { type: "string" }, image: { type: "string" } } },
  },
};

// --- 2. TableUiSchema: whitelist columns + bind value renderers by name ---
const tableUiSchema: TableUiSchema = {
  type: "Table",
  mode: "whitelist",
  columns: [
    { scope: "#/properties/name", label: "Name" },
    { scope: "#/properties/category", label: "Category" },
    {
      scope: "#/properties/rating",
      label: "Rating",
      options: { [VALUE_RENDERER_OPTION]: "fiveStar" },
    },
    {
      scope: "#/properties/price",
      label: "Price",
      options: {
        [VALUE_RENDERER_OPTION]: "currency",
        [VALUE_RENDERER_OPTIONS_KEY]: { currency: "EUR", unit: "minor", locale: "de-DE" },
      },
    },
    { scope: "#/properties/releasedAt", label: "Released" },
    { scope: "#/properties/tags", label: "Tags" },
  ],
};

// --- 3. Row data: JSON-LD documents (nested objects/arrays, not SPARQL flat rows) ---
const rows = [
  {
    "@type": "http://example.org/ShopItem",
    "@id": "http://example.org/shop-item/1",
    name: "Fender Stratocaster '57 Reissue",
    category: {
      "@type": "http://example.org/Category",
      "@id": "http://example.org/category/vintage",
      name: "Vintage instruments",
    },
    rating: 5,
    price: 249900,
    releasedAt: "2024-03-15T10:00:00.000Z",
    tags: [
      {
        "@type": "http://example.org/Tag",
        "@id": "http://example.org/tag/vintage",
        name: "Vintage",
        image: "https://example.org/tag-vintage.jpg",
      },
    ],
  },
];

// =============================================================================
// Option A — Headless: compose columns yourself, pass inline data
// =============================================================================
// Column registry entries come from composeJsonLdColumns → jsonLdColumnRegistry.
// Chip + value renderer injection lives in JsonLdTableProvider (not on columns).

function ShopItemTableHeadless() {
  const loadedSchema = useMemo(
    () => bringDefinitionToTop(schema, "ShopItem"),
    [],
  );

  const columns = useMemo(
    () =>
      composeJsonLdColumns(loadedSchema, {
        typeName: "ShopItem",
        tableUiSchema,
        t: (key) => key,
      }),
    [loadedSchema],
  );

  return (
    <JsonLdTableProvider
      value={{
        ChipComponent: SemanticChipNoOps,
        valueRenderers: [fiveStarValueRendererEntry, ...defaultValueRenderers],
        typeIRIToTypeName: (iri) => iri.replace("http://example.org/", ""),
        onShowEntry: (entityIRI) => openDetailModal(entityIRI),
        locale: "de",
      }}
    >
      <SemanticTableView
        typeName="ShopItem"
        columns={columns}
        data={rows}
        rowCount={rows.length}
        columnOrder={columns.map((c) => String(c.id))}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        onPaginationChange={() => {}}
        sorting={[]}
        onSortingChange={() => {}}
        manualPagination={false}
      />
    </JsonLdTableProvider>
  );
}

// =============================================================================
// Option B — SemanticTable: store-backed rows, provider wired internally
// =============================================================================
// Pass the same tableUiSchema + jsonLdCell; SemanticTable composes columns and
// wraps JsonLdTableProvider when rowShape="jsonld". Data comes from the store.

function ShopItemTableWithStore() {
  return (
    <SemanticTable
      typeName="ShopItem"
      rowShape="jsonld"
      tableUiSchema={tableUiSchema}
      jsonLdCell={{
        ChipComponent: SemanticChipNoOps,
        extraValueRenderers: [fiveStarValueRendererEntry],
      }}
    />
  );
}

// Override the built-in registry per table via columnRegistry prop on SemanticTable
// or composeJsonLdColumns({ ..., columnRegistry: myRegistry }).`;
