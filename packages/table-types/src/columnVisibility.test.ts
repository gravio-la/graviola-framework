import { describe, expect, test } from "bun:test";

import {
  applyTableUiSchemaToColumns,
  buildColumnVisibilityFromTableUiSchema,
  type ColumnLike,
  resolveColumnIdForScope,
  resolveDefaultSortingFromTableUiSchema,
} from "./columnVisibility";

describe("table column visibility helpers", () => {
  test("resolveColumnIdForScope maps meta scopes to SPARQL ids", () => {
    expect(
      resolveColumnIdForScope(
        "#/properties/$meta/properties/modified",
        "sparql-select",
      ),
    ).toBe("entityMeta_modified_single");
  });

  test("buildColumnVisibilityFromTableUiSchema hides hiddenByDefault columns", () => {
    const columns: ColumnLike[] = [
      { id: "name_single", header: "Name" },
      { id: "entityMeta_modified_single", header: "Modified" },
    ];

    const visibility = buildColumnVisibilityFromTableUiSchema(
      {
        type: "Table",
        mode: "blacklist",
        columns: [
          {
            scope: "#/properties/$meta/properties/modified",
            visibility: "hiddenByDefault",
          },
        ],
      },
      columns,
      "sparql-select",
    );

    expect(visibility.entityMeta_modified_single).toBe(false);
  });

  test("applyTableUiSchemaToColumns wires sortable to enableSorting", () => {
    const columns: ColumnLike[] = [
      { id: "entityMeta_modified_single", header: "Modified" },
    ];

    const updated = applyTableUiSchemaToColumns(
      columns,
      {
        type: "Table",
        mode: "blacklist",
        columns: [
          {
            scope: "#/properties/$meta/properties/modified",
            label: "Geändert",
            sortable: true,
          },
        ],
      },
      "sparql-select",
    );

    expect(updated[0]?.header).toBe("Geändert");
    expect(updated[0]?.enableSorting).toBe(true);
  });

  test("resolveDefaultSortingFromTableUiSchema reads defaultSort option", () => {
    const sorting = resolveDefaultSortingFromTableUiSchema(
      {
        type: "Table",
        mode: "blacklist",
        columns: [],
        options: {
          defaultSort: {
            scope: "#/properties/$meta/properties/modified",
            desc: true,
          },
        },
      },
      "sparql-select",
    );

    expect(sorting).toEqual([{ id: "entityMeta_modified_single", desc: true }]);
  });
});
