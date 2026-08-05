/**
 * Typed filter pipeline integration tests.
 *
 * Verifies Prisma-style where/include/select/orderBy against any Store that
 * advertises `filters: true` (SPARQL, Prisma, REST-over-*).
 *
 * SPARQL-specific flavour / LATERAL parity cases are gated on
 * `capabilities.speaksNative` + `profiles.sparqlFeatures`.
 *
 * Capability-gated: runs only when `supports("filters")`.
 */
import { describe, test, expect, beforeEach } from "bun:test";
import type { DatastoreContractStoreWithFilters } from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory, makeItem, makeTag } from "../fixtures/testData";

function speaksSparql(store: DatastoreContractStoreWithFilters): boolean {
  const langs = store.capabilities?.profiles?.speaksNative;
  return Array.isArray(langs) && langs.includes("sparql");
}

export function runTypedFilterSuite(
  getStore: () => DatastoreContractStoreWithFilters,
): void {
  describe("Typed Filters", () => {
    // Fixture IRIs
    const cat1 = entityIRI("Category", "electronics");
    const cat2 = entityIRI("Category", "books");
    const cat3 = entityIRI("Category", "sports");

    const tag1 = entityIRI("Tag", "new");
    const tag2 = entityIRI("Tag", "sale");
    const tag3 = entityIRI("Tag", "featured");

    const item1 = entityIRI("Item", "laptop");
    const item2 = entityIRI("Item", "book");
    const item3 = entityIRI("Item", "football");

    beforeEach(async () => {
      const store = getStore();

      // Insert categories
      await store.upsert(
        "Category",
        cat1,
        makeCategory("electronics", { name: "Electronics" }),
      );
      await store.upsert(
        "Category",
        cat2,
        makeCategory("books", { name: "Books" }),
      );
      await store.upsert(
        "Category",
        cat3,
        makeCategory("sports", { name: "Sports" }),
      );

      // Insert tags
      await store.upsert("Tag", tag1, makeTag("new", { name: "New" }));
      await store.upsert("Tag", tag2, makeTag("sale", { name: "Sale" }));
      await store.upsert(
        "Tag",
        tag3,
        makeTag("featured", { name: "Featured" }),
      );

      // Insert items with relations
      await store.upsert(
        "Item",
        item1,
        makeItem("laptop", {
          name: "Laptop",
          description: "A powerful laptop",
          price: 999.99,
          isAvailable: true,
          category: { "@id": cat1 },
          tags: [{ "@id": tag1 }, { "@id": tag2 }, { "@id": tag3 }],
        }),
      );
      await store.upsert(
        "Item",
        item2,
        makeItem("book", {
          name: "TypeScript Handbook",
          description: "Learn TypeScript",
          price: 29.99,
          isAvailable: true,
          category: { "@id": cat2 },
          tags: [{ "@id": tag1 }],
        }),
      );
      await store.upsert(
        "Item",
        item3,
        makeItem("football", {
          name: "Football",
          description: "A football",
          price: 19.99,
          isAvailable: false,
          category: { "@id": cat3 },
          tags: [{ "@id": tag2 }],
        }),
      );
    });

    describe("filterTypedDocuments — WHERE filters", () => {
      test("no where — returns all Items", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {});
        expect(result.length).toBe(3);
      });

      test("name equals Laptop", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
        });
        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Laptop");
      });

      test("name contains 'book' (case-insensitive)", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { contains: "book", mode: "insensitive" } },
        });
        expect(result.length).toBe(1);
        expect(result[0].name).toBe("TypeScript Handbook");
      });

      test("price gte 50 — only expensive items", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { price: { gte: 50 } },
        });
        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Laptop");
        expect(result[0].price).toBe(999.99);
      });

      test("price range: gte 10 and lte 30", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { price: { gte: 10, lte: 30 } },
        });
        expect(result.length).toBe(2);
        const names = result.map((r: any) => r.name).sort();
        expect(names).toEqual(["Football", "TypeScript Handbook"]);
      });

      test("isAvailable equals true", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { isAvailable: { equals: true } },
        });
        expect(result.length).toBe(2);
        const names = result.map((r: any) => r.name).sort();
        expect(names).toEqual(["Laptop", "TypeScript Handbook"]);
      });

      test("name in ['Laptop', 'Football']", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { in: ["Laptop", "Football"] } },
        });
        expect(result.length).toBe(2);
        const names = result.map((r: any) => r.name).sort();
        expect(names).toEqual(["Football", "Laptop"]);
      });

      test("AND — price gte 10 AND isAvailable true", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: {
            AND: [{ price: { gte: 10 } }, { isAvailable: { equals: true } }],
          },
        });
        expect(result.length).toBe(2);
        const names = result.map((r: any) => r.name).sort();
        expect(names).toEqual(["Laptop", "TypeScript Handbook"]);
      });

      test("NOT — not available", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: {
            NOT: { isAvailable: { equals: true } },
          },
        });
        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Football");
        expect(result[0].isAvailable).toBe(false);
      });

      test("NOT with AND — not (price < 20 AND available)", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: {
            NOT: {
              AND: [{ price: { lt: 20 } }, { isAvailable: { equals: true } }],
            },
          },
        });
        expect(result.length).toBe(3);
        const names = result.map((r: any) => r.name).sort();
        expect(names).toEqual(["Football", "Laptop", "TypeScript Handbook"]);
      });

      test("OR — price lte 25 OR name contains 'Lap'", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: {
            OR: [{ price: { lte: 25 } }, { name: { contains: "Lap" } }],
          },
        });
        expect(result.length).toBeGreaterThan(0);
        const names = result.map((r: any) => r.name);
        const hasMatches = names.some((name) =>
          ["Football", "Laptop"].includes(name),
        );
        expect(hasMatches).toBe(true);
      });

      test("empty where {} — returns all", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: {},
        });
        expect(result.length).toBe(3);
      });
    });

    describe("filterTypedDocuments — field projection", () => {
      test("select: { name: true, price: true }", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          select: { name: true, price: true },
        });
        expect(result.length).toBe(3);
        expect(result[0]).toHaveProperty("name");
        expect(result[0]).toHaveProperty("price");
      });
    });

    describe("filterTypedDocuments — include", () => {
      test("include: { category: true }", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: { category: true },
        });
        expect(result.length).toBe(1);
        expect(result[0].category).toBeTruthy();
        expect(result[0].category.name).toBe("Electronics");
      });

      test("include: { tags: true }", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: { tags: true },
        });
        expect(result.length).toBe(1);
        expect(Array.isArray(result[0].tags)).toBe(true);
        expect(result[0].tags.length).toBe(3);
        const tagNames = result[0].tags.map((t: any) => t.name).sort();
        expect(tagNames).toEqual(["Featured", "New", "Sale"]);
      });

      test("include: { tags: { take: 2 } } — pagination", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: { tags: { take: 2 } },
        });
        expect(result.length).toBe(1);
        expect(Array.isArray(result[0].tags)).toBe(true);
        expect(result[0].tags.length).toBeLessThanOrEqual(2);
      });

      test("include: { tags: { take: 2, skip: 1 } } — pagination with offset", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: { tags: { take: 2, skip: 1 } },
        });
        expect(result.length).toBe(1);
        expect(Array.isArray(result[0].tags)).toBe(true);
        expect(result[0].tags.length).toBeLessThanOrEqual(2);
      });
    });

    /**
     * End-to-end include + orderBy on relationship arrays (SUBSELECT + ORDER BY in CONSTRUCT).
     * Some backends (notably deterministic in-memory Oxigraph) still return bindings in graph order;
     * we assert multiplicity and completeness here rather than enforcing a collation order contract.
     */
    describe("filterTypedDocuments — include orderBy (real data)", () => {
      const LAPTOP_TAG_NAMES = ["Featured", "New", "Sale"] as const;

      test("include: { tags: { orderBy: { name: 'asc' } } } — returns all Laptop tags", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: { tags: { orderBy: { name: "asc" as const } } },
        });

        expect(result.length).toBe(1);
        const names = result[0].tags.map((t: { name: string }) => t.name);
        expect(names).toEqual(["Featured", "New", "Sale"]);
      });

      test("include: { tags: { orderBy: { name: 'desc' } } } — returns all Laptop tags", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: { tags: { orderBy: { name: "desc" as const } } },
        });

        expect(result.length).toBe(1);
        const names = result[0].tags.map((t: { name: string }) => t.name);
        expect(names).toEqual(["Sale", "New", "Featured"]);
      });

      test("include: { tags: { orderBy: [ { name: 'asc' }, { description: 'asc' } ] } } — multiplicity", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: {
            tags: {
              orderBy: [
                { name: "asc" as const },
                { description: "asc" as const },
              ],
            },
          },
        });

        expect(result.length).toBe(1);
        const names = result[0].tags.map((t: { name: string }) => t.name);
        expect(new Set(names)).toEqual(new Set(LAPTOP_TAG_NAMES));
      });

      test("include: { tags: { orderBy: { description: 'desc' } } } — multiplicity", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: { tags: { orderBy: { description: "desc" as const } } },
        });

        expect(result.length).toBe(1);
        const names = result[0].tags.map((t: { name: string }) => t.name);
        expect(new Set(names)).toEqual(new Set(LAPTOP_TAG_NAMES));
      });

      test("include: { tags: { take: 2, orderBy: { name: 'asc' } } } — windowed page", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: {
            tags: {
              take: 2,
              orderBy: { name: "asc" as const },
            },
          },
        });

        expect(result.length).toBe(1);
        expect(result[0].tags.length).toBe(2);
        const names = result[0].tags.map((t: { name: string }) => t.name);
        // Featured, New, Sale — first two ascending
        expect(names).toEqual(["Featured", "New"]);
      });

      test("include tags take+orderBy with flavour lateral", async () => {
        const store = getStore();
        if (!speaksSparql(store)) return;

        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: {
            tags: {
              take: 2,
              orderBy: { name: "asc" as const },
            },
          },
          flavour: "oxigraph",
        } as any);

        expect(result.length).toBe(1);
        expect(result[0].tags.length).toBe(2);
        expect(result[0].tags.map((t: { name: string }) => t.name)).toEqual([
          "Featured",
          "New",
        ]);
      });

      test("extraction vs lateral parity — same take+orderBy page", async () => {
        const store = getStore();
        if (!speaksSparql(store)) return;

        const include = {
          tags: {
            take: 2,
            orderBy: { name: "asc" as const },
          },
        };
        const where = { name: { equals: "Laptop" } };

        const extraction = await store.filterMany("Item", {
          where,
          include,
          flavour: "default",
        } as any);

        expect(extraction.length).toBe(1);
        const extractionNames = extraction[0].tags.map(
          (t: { name: string }) => t.name,
        );
        expect(extractionNames).toEqual(["Featured", "New"]);

        const stage = store.capabilities?.profiles?.nestedPagination?.stage;
        if (stage === "query") {
          const lateral = await store.filterMany("Item", {
            where,
            include,
            flavour: "oxigraph",
          } as any);
          expect(lateral.length).toBe(1);
          expect(lateral[0].tags.map((t: { name: string }) => t.name)).toEqual(
            extractionNames,
          );
        }
      });

      test("no include — relations omitted (Prisma default)", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
        });
        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Laptop");
        expect(result[0].category).toBeUndefined();
        expect(result[0].tags).toBeUndefined();
      });

      test("include tags maxRecursion: 0 — stub / orderBy scalars only", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: {
            tags: {
              take: 2,
              orderBy: { name: "asc" as const },
              maxRecursion: 0,
            },
          },
        } as any);

        expect(result.length).toBe(1);
        expect(result[0].tags.length).toBe(2);
        expect(result[0].tags.map((t: { name: string }) => t.name)).toEqual([
          "Featured",
          "New",
        ]);
        // Stub path still carries orderBy scalars; no nested relations on Tag
        for (const tag of result[0].tags) {
          expect(tag.name).toBeTruthy();
        }
      });

      test("filterOne — include tags with multi-key orderBy — multiplicity", async () => {
        const store = getStore();
        const result = await store.filterOne("Item", item1, {
          include: {
            tags: {
              orderBy: [
                { name: "desc" as const },
                { description: "asc" as const },
              ],
            },
          },
        });

        expect(result).toBeTruthy();
        const names = result!.tags!.map((t: { name: string }) => t.name);
        expect(new Set(names)).toEqual(new Set(LAPTOP_TAG_NAMES));
      });
    });

    describe("filterTypedDocuments — combined", () => {
      test("where + select", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { price: { gte: 50 } },
          select: { name: true, price: true },
        });
        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Laptop");
        expect(result[0].price).toBe(999.99);
      });

      test("where + include category", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { in: ["Laptop", "TypeScript Handbook"] } },
          include: { category: true },
        });
        expect(result.length).toBe(2);
        expect(result[0].category).toBeTruthy();
        expect(result[0].category.name).toBeTruthy();
        expect(result[1].category).toBeTruthy();
        expect(result[1].category.name).toBeTruthy();
      });

      test("where + include tags with pagination", async () => {
        const store = getStore();
        const result = await store.filterMany("Item", {
          where: { name: { equals: "Laptop" } },
          include: { tags: { take: 2 } },
        });
        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Laptop");
        expect(Array.isArray(result[0].tags)).toBe(true);
        expect(result[0].tags.length).toBeLessThanOrEqual(2);
      });
    });

    describe("filterTypedDocument — single entity", () => {
      test("load by IRI, no options", async () => {
        const store = getStore();
        const result = await store.filterOne("Item", item1, {});
        expect(result).toBeTruthy();
        expect(result?.name).toBe("Laptop");
        expect(result?.price).toBe(999.99);
      });

      test("with select: { name: true, price: true }", async () => {
        const store = getStore();
        const result = await store.filterOne("Item", item1, {
          select: { name: true, price: true },
        });
        expect(result).toBeTruthy();
        expect(result?.name).toBe("Laptop");
        expect(result?.price).toBe(999.99);
      });

      test("with include: { category: true, tags: true }", async () => {
        const store = getStore();
        const result = await store.filterOne("Item", item1, {
          include: { category: true, tags: true },
        });
        expect(result).toBeTruthy();
        expect(result?.category).toBeTruthy();
        expect(result?.category?.name).toBe("Electronics");
        expect(Array.isArray(result?.tags)).toBe(true);
        expect(result?.tags?.length).toBe(3);
      });

      test("non-existent IRI returns null or empty object", async () => {
        const store = getStore();
        const nonExistentIRI = entityIRI("Item", "does-not-exist");
        const result = await store.filterOne("Item", nonExistentIRI, {});
        if (result === null) {
          expect(result).toBeNull();
        } else {
          expect(result?.["@id"]).toBe(nonExistentIRI);
          expect(result?.name).toBeUndefined();
        }
      });
    });
  });
}
