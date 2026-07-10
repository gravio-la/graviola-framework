import { describe, expect, test } from "bun:test";

import {
  applyTableUiSchemaToColumns,
  buildColumnVisibilityFromTableUiSchema,
  type ColumnLike,
  resolveActiveMetaAnnotationScopes,
  normalizeTableUiSchemaForRowShape,
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

  test("normalizeTableUiSchemaForRowShape shows meta lifecycle columns on jsonld", () => {
    const normalized = normalizeTableUiSchemaForRowShape(
      {
        type: "Table",
        mode: "blacklist",
        columns: [
          {
            scope: "#/properties/$meta/properties/created",
            visibility: "hiddenByDefault",
          },
          {
            scope: "#/properties/$meta/properties/modified",
            visibility: "hiddenByDefault",
          },
        ],
      },
      "jsonld",
    );

    expect(normalized?.columns[0]?.visibility).toBe("visible");
    expect(normalized?.columns[1]?.visibility).toBe("visible");

    const source = {
      type: "Table" as const,
      mode: "blacklist" as const,
      columns: [
        {
          scope: "#/properties/$meta/properties/created",
          visibility: "hiddenByDefault" as const,
        },
      ],
    };
    expect(normalizeTableUiSchemaForRowShape(source, "sparql-select")).toBe(
      source,
    );
  });

  test("resolveActiveMetaAnnotationScopes includes visible, sorted, and defaultSort meta columns", () => {
    const tableUiSchema = {
      type: "Table" as const,
      mode: "blacklist" as const,
      columns: [
        {
          scope: "#/properties/$meta/properties/created",
          visibility: "hiddenByDefault" as const,
        },
        {
          scope: "#/properties/$meta/properties/modified",
          visibility: "hiddenByDefault" as const,
        },
        {
          scope: "#/properties/$meta",
          visibility: "forbidden" as const,
        },
      ],
      options: {
        defaultSort: {
          scope: "#/properties/$meta/properties/modified",
          desc: true,
        },
      },
    };

    const visibleOnly = resolveActiveMetaAnnotationScopes(
      tableUiSchema,
      new Set(["entityMeta_created_single"]),
      [],
      "sparql-select",
    );
    expect(visibleOnly).toEqual([
      "#/properties/$meta/properties/created",
      "#/properties/$meta/properties/modified",
    ]);

    const withDefaultSort = resolveActiveMetaAnnotationScopes(
      tableUiSchema,
      new Set<string>(),
      [],
      "sparql-select",
    );
    expect(withDefaultSort).toEqual(["#/properties/$meta/properties/modified"]);

    const withSort = resolveActiveMetaAnnotationScopes(
      tableUiSchema,
      new Set<string>(),
      ["entityMeta_created_single"],
      "sparql-select",
    );
    expect(withSort).toEqual([
      "#/properties/$meta/properties/created",
      "#/properties/$meta/properties/modified",
    ]);
  });
});
