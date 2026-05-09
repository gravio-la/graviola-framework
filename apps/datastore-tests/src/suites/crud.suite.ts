/**
 * Core CRUD contract tests.
 *
 * Tests: upsert, loadOne, exists, remove.
 * These are required capabilities for ALL adapters (Store baseline).
 */
import { describe, test, expect } from "bun:test";
import type { DatastoreContractStore } from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory, makeItem } from "../fixtures/testData";

export function runCrudSuite(getStore: () => DatastoreContractStore): void {
  describe("CRUD", () => {
    const catId = entityIRI("Category", "crud-cat1");
    const itemId = entityIRI("Item", "crud-item1");

    describe("upsert + loadOne", () => {
      test("creates a flat entity and loads it back", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsert("Category", catId, cat as never);

        const loaded = await store.loadOne("Category", catId);
        expect(loaded).toBeTruthy();
        expect(loaded?.name).toBe("Category crud-cat1");
        expect(loaded?.description).toBe("Description of category crud-cat1");
      });

      test("loaded document contains @id", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsert("Category", catId, cat as never);

        const loaded = await store.loadOne("Category", catId);
        expect(loaded?.["@id"]).toBe(catId);
      });

      test("upsert is idempotent — re-saving same data does not duplicate", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsert("Category", catId, cat as never);
        await store.upsert("Category", catId, cat as never);

        const all = await store.list("Category");
        expect(all.length).toBe(1);
      });

      test("updates fields on second upsert", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsert("Category", catId, cat as never);

        const updated = { ...cat, name: "Updated Category" };
        await store.upsert("Category", catId, updated as never);

        const loaded = await store.loadOne("Category", catId);
        expect(loaded?.name).toBe("Updated Category");
      });

      test("creates an item with scalar fields", async () => {
        const store = getStore();
        const item = makeItem("crud-item1");
        await store.upsert("Item", itemId, item as never);

        const loaded = await store.loadOne("Item", itemId);
        expect(loaded?.name).toBe("Item crud-item1");
        expect(loaded?.price).toBe(9.99);
        expect(loaded?.isAvailable).toBe(true);
      });
    });

    describe("exists", () => {
      test("returns false for a non-existent entity", async () => {
        const store = getStore();
        const exists = await store.exists(
          "Category",
          entityIRI("Category", "nonexistent"),
        );
        expect(exists).toBe(false);
      });

      test("returns true after upsert", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsert("Category", catId, cat as never);
        const exists = await store.exists("Category", catId);
        expect(exists).toBe(true);
      });
    });

    describe("remove", () => {
      test("removes an existing entity", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsert("Category", catId, cat as never);

        await store.remove("Category", catId);

        const exists = await store.exists("Category", catId);
        expect(exists).toBe(false);
      });

      test("entity is gone from list after removal", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsert("Category", catId, cat as never);
        await store.remove("Category", catId);

        const all = await store.list("Category");
        expect(all.length).toBe(0);
      });
    });

    describe("nested references", () => {
      test("item with category reference round-trips", async () => {
        const store = getStore();
        const cat = makeCategory("crud-cat1");
        await store.upsert("Category", catId, cat as never);

        const item = makeItem("crud-item1", {
          category: { "@id": catId },
        });
        await store.upsert("Item", itemId, item as never);

        const loaded = await store.loadOne("Item", itemId);
        expect(loaded?.category?.["@id"]).toBe(catId);
      });
    });
  });
}
