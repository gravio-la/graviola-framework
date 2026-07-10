import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import {
  baseMetaSchemaProfile,
  deriveExtendedSchema,
  extendMetaSchema,
  ENTITY_META_JSON_KEY,
} from "@graviola/meta-schema";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";

import { composeSparqlSelectColumns } from "./composeSparqlSelectColumns";

const domainSchema: JSONSchema7 = {
  type: "object",
  definitions: {
    Item: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
      },
    },
  },
};

describe("composeSparqlSelectColumns", () => {
  test("adds hidden meta lifecycle columns from tableUiSchema", () => {
    const extended = deriveExtendedSchema(domainSchema, baseMetaSchemaProfile, {
      includeLifecycle: true,
      graftPropertyKey: ENTITY_META_JSON_KEY,
    });
    const loaded = bringDefinitionToTop(extended, "Item");
    const t = (key: string) => key;

    const columns = composeSparqlSelectColumns(loaded, {
      typeName: "Item",
      t,
      tableUiSchema: {
        type: "Table",
        mode: "blacklist",
        columns: [
          {
            scope: "#/properties/$meta/properties/created",
            label: "Created",
            visibility: "hiddenByDefault",
          },
          {
            scope: "#/properties/$meta/properties/modified",
            label: "Modified",
            sortable: true,
            visibility: "hiddenByDefault",
          },
        ],
      },
    });

    const modified = columns.find(
      (col) => col.id === "entityMeta_modified_single",
    );
    expect(modified).toBeDefined();
    expect(modified?.header).toBe("Modified");
    expect(modified?.enableSorting).toBe(true);

    expect(columns.find((col) => col.id === "$meta_single")).toBeUndefined();
    expect(
      columns.find((col) => col.id === "entityMeta_created_single"),
    ).toBeDefined();
  });

  test("adds meta columns when EntityMeta uses allOf profile", () => {
    const metaProfile = extendMetaSchema(baseMetaSchemaProfile, {
      type: "object",
      properties: {
        reviewStatus: { type: "string" },
      },
    });
    const extended = deriveExtendedSchema(domainSchema, metaProfile, {
      includeLifecycle: true,
      graftPropertyKey: ENTITY_META_JSON_KEY,
    });
    const loaded = bringDefinitionToTop(extended, "Item");
    const columns = composeSparqlSelectColumns(loaded, {
      typeName: "Item",
      t: (key: string) => key,
      tableUiSchema: {
        type: "Table",
        mode: "blacklist",
        columns: [
          { scope: "#/properties/$meta", visibility: "forbidden" },
          {
            scope: "#/properties/$meta/properties/modified",
            label: "Modified",
            sortable: true,
          },
        ],
      },
    });

    expect(
      columns.find((col) => col.id === "entityMeta_modified_single"),
    ).toBeDefined();
    expect(columns.find((col) => col.id === "$meta_single")).toBeUndefined();
    expect(columns.find((col) => col.id === "$meta_entity")).toBeUndefined();
  });
});
