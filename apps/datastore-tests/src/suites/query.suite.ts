/**
 * Query contract tests.
 *
 * Tests: list (search-driven listing via StoreListQuery, limit).
 * These are required capabilities for ALL adapters.
 */
import { describe, test, expect } from "bun:test";
import type { DatastoreContractStore } from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory, makeItem } from "../fixtures/testData";

export function runQuerySuite(getStore: () => DatastoreContractStore): void {
  describe("Query", () => {
    describe("list", () => {
      test("returns empty array when no documents exist", async () => {
        const store = getStore();
        const results = await store.list("Category");
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      });

      test("returns all inserted documents", async () => {
        const store = getStore();
        await store.upsert(
          "Category",
          entityIRI("Category", "q-cat1"),
          makeCategory("q-cat1") as never,
        );
        await store.upsert(
          "Category",
          entityIRI("Category", "q-cat2"),
          makeCategory("q-cat2") as never,
        );
        await store.upsert(
          "Category",
          entityIRI("Category", "q-cat3"),
          makeCategory("q-cat3") as never,
        );

        const results = await store.list("Category");
        expect(results.length).toBe(3);
      });

      test("respects limit parameter", async () => {
        const store = getStore();
        for (let i = 1; i <= 5; i++) {
          await store.upsert(
            "Category",
            entityIRI("Category", `q-lim${i}`),
            makeCategory(`q-lim${i}`) as never,
          );
        }
        const results = await store.list("Category", 3);
        expect(results.length).toBeLessThanOrEqual(3);
      });
    });

    describe("list — search", () => {
      test("returns all documents when no search term", async () => {
        const store = getStore();
        await store.upsert(
          "Category",
          entityIRI("Category", "q-s1"),
          makeCategory("q-s1", { name: "Alpha" }) as never,
        );
        await store.upsert(
          "Category",
          entityIRI("Category", "q-s2"),
          makeCategory("q-s2", { name: "Beta" }) as never,
        );

        const results = await store.list("Category");
        expect(results.length).toBe(2);
      });

      test("filters by search term (case-insensitive substring match)", async () => {
        const store = getStore();
        await store.upsert(
          "Category",
          entityIRI("Category", "q-alpha"),
          makeCategory("q-alpha", {
            name: "Alpha Cat",
            description: "Feline things",
          }) as never,
        );
        await store.upsert(
          "Category",
          entityIRI("Category", "q-beta"),
          makeCategory("q-beta", {
            name: "Beta Cat",
            description: "More feline things",
          }) as never,
        );
        await store.upsert(
          "Category",
          entityIRI("Category", "q-gamma"),
          makeCategory("q-gamma", {
            name: "Gamma Dog",
            description: "Canine things",
          }) as never,
        );

        const results = await store.list("Category", undefined, {
          search: "cat",
        });
        expect(results.length).toBe(2);
        const names = results.map((r: { name?: string }) => r.name);
        expect(names).toContain("Alpha Cat");
        expect(names).toContain("Beta Cat");
      });
    });

    describe("list — limit with search/query", () => {
      test("respects limit parameter when listing", async () => {
        const store = getStore();
        for (let i = 1; i <= 10; i++) {
          await store.upsert(
            "Item",
            entityIRI("Item", `q-page${i}`),
            makeItem(`q-page${i}`, {
              name: `Item ${String(i).padStart(2, "0")}`,
            }) as never,
          );
        }

        const results = await store.list("Item", 4);
        expect(results.length).toBeLessThanOrEqual(4);
        expect(results.length).toBeGreaterThan(0);
      });
    });
  });
}
