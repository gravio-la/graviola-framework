import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import {
  VALUE_RENDERER_OPTION,
  VALUE_RENDERER_OPTIONS_KEY,
} from "@graviola/edb-detail-renderer-core";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";

import { composeJsonLdColumns } from "./composeJsonLdColumns";

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
});
