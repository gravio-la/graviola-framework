/**
 * countDocuments contract tests.
 * Only run when adapter.capabilities.countDocuments === true.
 */
import { describe, test, expect } from "bun:test";
import type { AbstractDatastore } from "@graviola/edb-global-types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory } from "../fixtures/testData";

export function runCountSuite(getStore: () => AbstractDatastore): void {
  describe("countDocuments", () => {
    test("returns 0 for empty store", async () => {
      const store = getStore();
      const count = await store.countDocuments!("Category");
      expect(count).toBe(0);
    });

    test("counts all documents of a type", async () => {
      const store = getStore();
      for (let i = 1; i <= 3; i++) {
        await store.upsertDocument(
          "Category",
          entityIRI("Category", `cnt${i}`),
          makeCategory(`cnt${i}`),
        );
      }

      const count = await store.countDocuments!("Category");
      expect(count).toBe(3);
    });

    test("count is type-scoped (Item count does not affect Category count)", async () => {
      const store = getStore();
      await store.upsertDocument(
        "Category",
        entityIRI("Category", "cnt-c1"),
        makeCategory("cnt-c1"),
      );

      // Add items — should not affect category count
      const { makeItem } = await import("../fixtures/testData");
      await store.upsertDocument(
        "Item",
        entityIRI("Item", "cnt-i1"),
        makeItem("cnt-i1"),
      );

      const catCount = await store.countDocuments!("Category");
      expect(catCount).toBe(1);
    });

    test("count updates after removal", async () => {
      const store = getStore();
      const id1 = entityIRI("Category", "cnt-r1");
      const id2 = entityIRI("Category", "cnt-r2");
      await store.upsertDocument("Category", id1, makeCategory("cnt-r1"));
      await store.upsertDocument("Category", id2, makeCategory("cnt-r2"));

      expect(await store.countDocuments!("Category")).toBe(2);

      await store.removeDocument("Category", id1);
      expect(await store.countDocuments!("Category")).toBe(1);
    });
  });
}
