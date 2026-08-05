import { describe, expect, test } from "bun:test";

import { whereToPrisma } from "./whereToPrisma";

describe("whereToPrisma", () => {
  test("maps @id and @type", () => {
    const result = whereToPrisma(
      {
        "@id": "http://ex/Item/1",
        "@type": "http://ex/Item",
        name: { equals: "Laptop" },
      },
      {
        IRItoId: (iri) => iri.replace("http://ex/Item/", ""),
        typeIRItoTypeName: (iri) => iri.replace("http://ex/", ""),
      },
    );
    expect(result).toEqual({
      id: "1",
      type: "Item",
      name: { equals: "Laptop" },
    });
  });

  test("NodeReference shorthand becomes some:{id} for relations", () => {
    const result = whereToPrisma(
      { category: { "@id": "http://ex/Cat/1" } },
      { IRItoId: (iri) => iri.replace("http://ex/Cat/", "") },
    );
    expect(result).toEqual({
      category: { some: { id: "1" } },
    });
  });

  test("strips mode:insensitive when unsupported", () => {
    const result = whereToPrisma(
      { name: { contains: "book", mode: "insensitive" } },
      { supportsStringMode: false },
    );
    expect(result).toEqual({
      name: { contains: "book" },
    });
  });

  test("keeps mode:insensitive when supported", () => {
    const result = whereToPrisma(
      { name: { contains: "book", mode: "insensitive" } },
      { supportsStringMode: true },
    );
    expect(result).toEqual({
      name: { contains: "book", mode: "insensitive" },
    });
  });

  test("recurses AND/OR/NOT", () => {
    const result = whereToPrisma({
      AND: [
        { price: { gte: 10 } },
        { OR: [{ name: { contains: "Lap" } }, { isAvailable: true }] },
      ],
      NOT: { price: { lt: 1 } },
    });
    expect(result).toEqual({
      AND: [
        { price: { gte: 10 } },
        { OR: [{ name: { contains: "Lap" } }, { isAvailable: true }] },
      ],
      NOT: { price: { lt: 1 } },
    });
  });

  test("childTable primitive sugar expands contains to some.value", () => {
    const result = whereToPrisma(
      { photos: { contains: "violin" } },
      {
        typeName: "Item",
        persistenceManifest: {
          databaseProvider: "sqlite",
          types: {
            Item: {
              photos: {
                representation: "childTable",
                childModel: "Item_photos",
                valueType: "String",
                parentFk: "Item_id",
                parentRelation: "Item",
              },
            },
          },
        },
      },
    );
    expect(result).toEqual({
      photos: { some: { value: { contains: "violin" } } },
    });
  });

  test("scalarList maps equals to has; rejects contains", () => {
    const opts = {
      typeName: "Item",
      persistenceManifest: {
        databaseProvider: "mongodb",
        types: {
          Item: {
            photos: {
              representation: "scalarList" as const,
              valueType: "String" as const,
            },
          },
        },
      },
    };
    expect(whereToPrisma({ photos: { equals: "/a.jpg" } }, opts)).toEqual({
      photos: { has: "/a.jpg" },
    });
    expect(() => whereToPrisma({ photos: { contains: "a" } }, opts)).toThrow(
      /Substring filters/,
    );
  });
});
