import { describe, expect, test } from "bun:test";

import { loadGraviolaSideSchema } from "./loadGraviolaSideSchema";

describe("loadGraviolaSideSchema", () => {
  test("accepts a minimal valid side-schema", () => {
    const loaded = loadGraviolaSideSchema({
      schemaName: "demo",
      primaryFields: { Item: { label: "name" } },
      viewConfig: {
        detail: {
          detailLayoutType: "ArticleLayout",
          nesting: { collapsible: true },
        },
      },
    });
    expect(loaded.schemaName).toBe("demo");
    expect(loaded.viewConfig?.detail?.detailLayoutType).toBe("ArticleLayout");
  });

  test("rejects unknown top-level keys", () => {
    expect(() =>
      loadGraviolaSideSchema({
        schemaName: "demo",
        parliamentOnly: true,
      }),
    ).toThrow(/Invalid Graviola side-schema/);
  });
});
