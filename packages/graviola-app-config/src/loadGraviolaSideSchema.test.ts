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

  test("accepts valid orderBy", () => {
    const loaded = loadGraviolaSideSchema({
      schemaName: "demo",
      orderBy: {
        Rezept: {
          schritte: { field: "reihenfolge", direction: "asc" },
        },
      },
    });
    expect(loaded.orderBy?.Rezept?.schritte).toEqual({
      field: "reihenfolge",
      direction: "asc",
    });
  });

  test("rejects orderBy with bad direction", () => {
    expect(() =>
      loadGraviolaSideSchema({
        schemaName: "demo",
        orderBy: {
          Rezept: {
            schritte: { field: "reihenfolge", direction: "sideways" },
          },
        },
      }),
    ).toThrow(/Invalid Graviola side-schema/);
  });

  test("accepts valid defaults", () => {
    const loaded = loadGraviolaSideSchema({
      schemaName: "demo",
      defaults: {
        ZutatInRezept: {
          einheit: { path: ["zutatRef", "standardEinheit"] },
        },
      },
    });
    expect(loaded.defaults?.ZutatInRezept?.einheit).toEqual({
      path: ["zutatRef", "standardEinheit"],
    });
  });

  test("rejects defaults with empty path", () => {
    expect(() =>
      loadGraviolaSideSchema({
        schemaName: "demo",
        defaults: {
          ZutatInRezept: {
            einheit: { path: [] },
          },
        },
      }),
    ).toThrow(/Invalid Graviola side-schema/);
  });

  test("accepts valid linkFilters", () => {
    const loaded = loadGraviolaSideSchema({
      schemaName: "demo",
      linkFilters: {
        Booking: {
          guest: {
            where: { tier: { equals: { $data: "host.tier" } } },
          },
        },
      },
    });
    expect(loaded.linkFilters?.Booking?.guest?.where).toEqual({
      tier: { equals: { $data: "host.tier" } },
    });
  });

  test("rejects linkFilters without where", () => {
    expect(() =>
      loadGraviolaSideSchema({
        schemaName: "demo",
        linkFilters: {
          Booking: {
            guest: { description: "only desc" },
          },
        },
      }),
    ).toThrow(/Invalid Graviola side-schema/);
  });

  test("rejects orderBy spec with unknown inner keys", () => {
    expect(() =>
      loadGraviolaSideSchema({
        schemaName: "demo",
        orderBy: {
          Rezept: {
            schritte: {
              field: "reihenfolge",
              direction: "asc",
              extra: true,
            },
          },
        },
      }),
    ).toThrow(/Invalid Graviola side-schema/);
  });
});
