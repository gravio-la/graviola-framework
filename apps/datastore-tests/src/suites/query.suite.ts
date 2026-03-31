/**
 * Query contract tests.
 *
 * Tests: listDocuments, findDocuments (search, pagination, sorting).
 * These are required capabilities for ALL adapters.
 */
import { describe, test, expect, beforeAll } from "bun:test";
import type { AbstractDatastore } from "@graviola/edb-global-types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory, makeItem } from "../fixtures/testData";

export function runQuerySuite(getStore: () => AbstractDatastore): void {
  describe("Query", () => {
    describe("listDocuments", () => {
      test("returns empty array when no documents exist", async () => {
        const store = getStore();
        const results = await store.listDocuments("Category");
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      });

      test("returns all inserted documents", async () => {
        const store = getStore();
        await store.upsertDocument(
          "Category",
          entityIRI("Category", "q-cat1"),
          makeCategory("q-cat1"),
        );
        await store.upsertDocument(
          "Category",
          entityIRI("Category", "q-cat2"),
          makeCategory("q-cat2"),
        );
        await store.upsertDocument(
          "Category",
          entityIRI("Category", "q-cat3"),
          makeCategory("q-cat3"),
        );

        const results = await store.listDocuments("Category");
        expect(results.length).toBe(3);
      });

      test("respects limit parameter", async () => {
        const store = getStore();
        for (let i = 1; i <= 5; i++) {
          await store.upsertDocument(
            "Category",
            entityIRI("Category", `q-lim${i}`),
            makeCategory(`q-lim${i}`),
          );
        }
        const results = await store.listDocuments("Category", 3);
        expect(results.length).toBeLessThanOrEqual(3);
      });
    });

    describe("findDocuments — search", () => {
      test("returns all documents when no search term", async () => {
        const store = getStore();
        await store.upsertDocument(
          "Category",
          entityIRI("Category", "q-s1"),
          makeCategory("q-s1", { name: "Alpha" }),
        );
        await store.upsertDocument(
          "Category",
          entityIRI("Category", "q-s2"),
          makeCategory("q-s2", { name: "Beta" }),
        );

        const results = await store.findDocuments("Category", {});
        expect(results.length).toBe(2);
      });

      test("filters by search term (case-insensitive substring match)", async () => {
        const store = getStore();
        await store.upsertDocument(
          "Category",
          entityIRI("Category", "q-alpha"),
          makeCategory("q-alpha", {
            name: "Alpha Cat",
            description: "Feline things",
          }),
        );
        await store.upsertDocument(
          "Category",
          entityIRI("Category", "q-beta"),
          makeCategory("q-beta", {
            name: "Beta Cat",
            description: "More feline things",
          }),
        );
        await store.upsertDocument(
          "Category",
          entityIRI("Category", "q-gamma"),
          makeCategory("q-gamma", {
            name: "Gamma Dog",
            description: "Canine things",
          }),
        );

        const results = await store.findDocuments("Category", {
          search: "cat",
        });
        expect(results.length).toBe(2);
        const names = results.map((r: any) => r.name);
        expect(names).toContain("Alpha Cat");
        expect(names).toContain("Beta Cat");
      });
    });

    describe("findDocuments — limit", () => {
      test("respects limit parameter", async () => {
        const store = getStore();
        for (let i = 1; i <= 10; i++) {
          await store.upsertDocument(
            "Item",
            entityIRI("Item", `q-page${i}`),
            makeItem(`q-page${i}`, {
              name: `Item ${String(i).padStart(2, "0")}`,
            }),
          );
        }

        const results = await store.findDocuments("Item", {}, 4);
        expect(results.length).toBeLessThanOrEqual(4);
        expect(results.length).toBeGreaterThan(0);
      });
    });
  });
}
