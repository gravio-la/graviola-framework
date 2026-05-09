/**
 * findDocumentsAsFlatResultSet contract tests.
 *
 * Capability-gated: {@link CapabilityDescriptor.flatResultSet}.
 */
import { describe, test, expect } from "bun:test";
import type { DatastoreContractStoreWithFlat } from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeItem } from "../fixtures/testData";

export function runFlatResultSetSuite(
  getStore: () => DatastoreContractStoreWithFlat,
): void {
  describe("findDocumentsAsFlatResultSet", () => {
    test("returns correct result set structure", async () => {
      const store = getStore();
      await store.upsert(
        "Item",
        entityIRI("Item", "frs1"),
        makeItem("frs1") as never,
      );

      const resultSet = await store.findDocumentsAsFlatResultSet("Item", {});
      expect(resultSet).toHaveProperty("head");
      expect(resultSet).toHaveProperty("results");
      expect(resultSet.head).toHaveProperty("vars");
      expect(resultSet.results).toHaveProperty("bindings");
      expect(Array.isArray(resultSet.head.vars)).toBe(true);
      expect(Array.isArray(resultSet.results.bindings)).toBe(true);
    });

    test("returns one binding per document", async () => {
      const store = getStore();
      for (let i = 1; i <= 3; i++) {
        await store.upsert(
          "Item",
          entityIRI("Item", `frs${i}`),
          makeItem(`frs${i}`) as never,
        );
      }

      const resultSet = await store.findDocumentsAsFlatResultSet("Item", {});
      expect(resultSet.results.bindings.length).toBe(3);
    });

    test("respects pagination in flat result set", async () => {
      const store = getStore();
      for (let i = 1; i <= 8; i++) {
        await store.upsert(
          "Item",
          entityIRI("Item", `frs-p${i}`),
          makeItem(`frs-p${i}`) as never,
        );
      }

      const page0 = await store.findDocumentsAsFlatResultSet(
        "Item",
        { pagination: { pageIndex: 0, pageSize: 5 } },
        5,
      );
      expect(page0.results.bindings.length).toBe(5);

      const page1 = await store.findDocumentsAsFlatResultSet(
        "Item",
        { pagination: { pageIndex: 1, pageSize: 5 } },
        5,
      );
      expect(page1.results.bindings.length).toBe(3);
    });
  });
}
