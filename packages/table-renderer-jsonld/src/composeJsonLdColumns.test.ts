import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import {
  VALUE_RENDERER_OPTION,
  VALUE_RENDERER_OPTIONS_KEY,
} from "@graviola/edb-detail-renderer-core";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";

import { composeJsonLdColumns } from "./composeJsonLdColumns";
import { JsonLdPrimaryColumnCell } from "./cells/JsonLdPrimaryColumnCell";

const schema: JSONSchema7 = {
  type: "object",
  definitions: {
    Item: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        price: { type: "integer" },
        releasedAt: { type: "string", format: "date-time" },
        tags: {
          type: "array",
          items: {
            type: "object",
            properties: { "@id": { type: "string" }, name: { type: "string" } },
          },
        },
      },
    },
  },
};

describe("composeJsonLdColumns", () => {
  test("builds columns for visible properties with cell renderers", () => {
    const loaded = bringDefinitionToTop(schema, "Item");
    const columns = composeJsonLdColumns(loaded, {
      typeName: "Item",
      tableUiSchema: {
        type: "Table",
        mode: "whitelist",
        columns: [
          { scope: "#/properties/name", label: "Name" },
          {
            scope: "#/properties/price",
            label: "Price",
            options: {
              [VALUE_RENDERER_OPTION]: "currency",
              [VALUE_RENDERER_OPTIONS_KEY]: { currency: "EUR", unit: "minor" },
            },
          },
          { scope: "#/properties/releasedAt", label: "Released" },
          { scope: "#/properties/tags", label: "Tags" },
        ],
      },
    });

    expect(columns).toHaveLength(4);
    expect(columns.map((c) => c.id)).toEqual([
      "#/properties/name",
      "#/properties/price",
      "#/properties/releasedAt",
      "#/properties/tags",
    ]);
    expect(columns.every((c) => c.Cell)).toBe(true);
  });

  test("supports nested $meta lifecycle scopes in blacklist mode", () => {
    const extended = {
      ...bringDefinitionToTop(schema, "Item"),
      properties: {
        ...bringDefinitionToTop(schema, "Item").properties,
        $meta: {
          type: "object",
          properties: {
            created: { type: "string", format: "date-time" },
            modified: { type: "string", format: "date-time" },
          },
        },
      },
    } as JSONSchema7;

    const columns = composeJsonLdColumns(extended, {
      typeName: "Item",
      tableUiSchema: {
        type: "Table",
        mode: "blacklist",
        columns: [
          {
            scope: "#/properties/$meta/properties/modified",
            label: "Modified",
            sortable: false,
          },
        ],
      },
    });

    const modified = columns.find(
      (col) => col.id === "#/properties/$meta/properties/modified",
    );
    expect(modified).toBeDefined();
    expect(modified?.enableSorting).toBe(false);
  });

  test("primary field label column uses the primary cell with image meta", () => {
    const loaded = bringDefinitionToTop(schema, "Item");
    const columns = composeJsonLdColumns(loaded, {
      typeName: "Item",
      primaryField: { label: "name", image: "image" },
    });

    const nameCol = columns.find((c) => c.id === "#/properties/name");
    expect(nameCol?.Cell).toBe(JsonLdPrimaryColumnCell as any);
    expect((nameCol?.meta as any)?.jsonLdPrimaryImageKey).toBe("image");
    expect((nameCol?.meta as any)?.jsonLdPrimaryTypeName).toBe("Item");

    const priceCol = columns.find((c) => c.id === "#/properties/price");
    expect(priceCol?.Cell).not.toBe(JsonLdPrimaryColumnCell as any);
  });
});
