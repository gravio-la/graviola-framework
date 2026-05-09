/**
 * count() contract tests.
 * Capability-gated: {@link CapabilityDescriptor.counts}.
 */
import { describe, test, expect } from "bun:test";
import type { DatastoreContractStoreWithCounts } from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory } from "../fixtures/testData";

export function runCountSuite(
  getStore: () => DatastoreContractStoreWithCounts,
): void {
  describe("count", () => {
    test("returns 0 for empty store", async () => {
      const store = getStore();
      const count = await store.count("Category");
      expect(count).toBe(0);
    });

    test("counts all documents of a type", async () => {
      const store = getStore();
      for (let i = 1; i <= 3; i++) {
        await store.upsert(
          "Category",
          entityIRI("Category", `cnt${i}`),
          makeCategory(`cnt${i}`) as never,
        );
      }

      const count = await store.count("Category");
      expect(count).toBe(3);
    });

    test("count is type-scoped (Item count does not affect Category count)", async () => {
      const store = getStore();
      await store.upsert(
        "Category",
        entityIRI("Category", "cnt-c1"),
        makeCategory("cnt-c1") as never,
      );

      const { makeItem } = await import("../fixtures/testData");
      await store.upsert(
        "Item",
        entityIRI("Item", "cnt-i1"),
        makeItem("cnt-i1") as never,
      );

      const catCount = await store.count("Category");
      expect(catCount).toBe(1);
    });

    test("count updates after removal", async () => {
      const store = getStore();
      const id1 = entityIRI("Category", "cnt-r1");
      const id2 = entityIRI("Category", "cnt-r2");
      await store.upsert("Category", id1, makeCategory("cnt-r1") as never);
      await store.upsert("Category", id2, makeCategory("cnt-r2") as never);

      expect(await store.count("Category")).toBe(2);

      await store.remove("Category", id1);
      expect(await store.count("Category")).toBe(1);
    });
  });
}
