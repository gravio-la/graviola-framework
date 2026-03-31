/**
 * Core CRUD contract tests.
 *
 * Tests: upsertDocument, loadDocument, existsDocument, removeDocument.
 * These are required capabilities for ALL adapters.
 */
import { describe, test, expect, beforeEach } from "bun:test";
import type { AbstractDatastore } from "@graviola/edb-global-types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory, makeItem, makeTag } from "../fixtures/testData";

export function runCrudSuite(getStore: () => AbstractDatastore): void {
  describe("CRUD", () => {
    const catId = entityIRI("Category", "crud-cat1");
    const tagId = entityIRI("Tag", "crud-tag1");
    const itemId = entityIRI("Item", "crud-item1");

    describe("upsertDocument + loadDocument", () => {
      test("creates a flat entity and loads it back", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsertDocument("Category", catId, cat);

        const loaded = await store.loadDocument("Category", catId);
        expect(loaded).toBeTruthy();
        expect(loaded?.name).toBe("Category crud-cat1");
        expect(loaded?.description).toBe("Description of category crud-cat1");
      });

      test("loaded document contains @id", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsertDocument("Category", catId, cat);

        const loaded = await store.loadDocument("Category", catId);
        expect(loaded?.["@id"]).toBe(catId);
      });

      test("upsert is idempotent — re-saving same data does not duplicate", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsertDocument("Category", catId, cat);
        await store.upsertDocument("Category", catId, cat);

        const all = await store.listDocuments("Category");
        expect(all.length).toBe(1);
      });

      test("updates fields on second upsert", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsertDocument("Category", catId, cat);

        const updated = { ...cat, name: "Updated Category" };
        await store.upsertDocument("Category", catId, updated);

        const loaded = await store.loadDocument("Category", catId);
        expect(loaded?.name).toBe("Updated Category");
      });

      test("creates an item with scalar fields", async () => {
        const store = getStore();
        const item = makeItem("crud-item1");
        await store.upsertDocument("Item", itemId, item);

        const loaded = await store.loadDocument("Item", itemId);
        expect(loaded?.name).toBe("Item crud-item1");
        expect(loaded?.price).toBe(9.99);
        expect(loaded?.isAvailable).toBe(true);
      });
    });

    describe("existsDocument", () => {
      test("returns false for a non-existent entity", async () => {
        const store = getStore();
        const exists = await store.existsDocument(
          "Category",
          entityIRI("Category", "nonexistent"),
        );
        expect(exists).toBe(false);
      });

      test("returns true after upsert", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsertDocument("Category", catId, cat);
        const exists = await store.existsDocument("Category", catId);
        expect(exists).toBe(true);
      });
    });

    describe("removeDocument", () => {
      test("removes an existing entity", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsertDocument("Category", catId, cat);

        await store.removeDocument("Category", catId);

        const exists = await store.existsDocument("Category", catId);
        expect(exists).toBe(false);
      });

      test("entity is gone from listDocuments after removal", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsertDocument("Category", catId, cat);
        await store.removeDocument("Category", catId);

        const all = await store.listDocuments("Category");
        expect(all.length).toBe(0);
      });
    });

    describe("nested references", () => {
      test("item with category reference round-trips", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsertDocument("Category", catId, cat);

        const item = makeItem("crud-item1", {
          category: { "@id": catId },
        });
        await store.upsertDocument("Item", itemId, item);

        const loaded = await store.loadDocument("Item", itemId);
        expect(loaded?.category?.["@id"]).toBe(catId);
      });
    });
  });
}
