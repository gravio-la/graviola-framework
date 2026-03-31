/**
 * findDocumentsAsFlatResultSet contract tests.
 *
 * This operation returns results in SPARQL-like result set format:
 *   { head: { vars: string[] }, results: { bindings: Array<Record<string, { type, value }>> } }
 *
 * Only run when adapter.capabilities.findDocumentsAsFlatResultSet === true.
 */
import { describe, test, expect } from "bun:test";
import type { AbstractDatastore } from "@graviola/edb-global-types";
import { entityIRI } from "../schema/testSchema";
import { makeItem, makeCategory } from "../fixtures/testData";

export function runFlatResultSetSuite(getStore: () => AbstractDatastore): void {
  describe("findDocumentsAsFlatResultSet", () => {
    test("returns correct result set structure", async () => {
      const store = getStore();
      await store.upsertDocument(
        "Item",
        entityIRI("Item", "frs1"),
        makeItem("frs1"),
      );

      const resultSet = await store.findDocumentsAsFlatResultSet!("Item", {});
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
        await store.upsertDocument(
          "Item",
          entityIRI("Item", `frs${i}`),
          makeItem(`frs${i}`),
        );
      }

      const resultSet = await store.findDocumentsAsFlatResultSet!("Item", {});
      expect(resultSet.results.bindings.length).toBe(3);
    });

    test("respects pagination in flat result set", async () => {
      const store = getStore();
      for (let i = 1; i <= 8; i++) {
        await store.upsertDocument(
          "Item",
          entityIRI("Item", `frs-p${i}`),
          makeItem(`frs-p${i}`),
        );
      }

      const page0 = await store.findDocumentsAsFlatResultSet!(
        "Item",
        { pagination: { pageIndex: 0, pageSize: 5 } },
        5,
      );
      expect(page0.results.bindings.length).toBe(5);

      const page1 = await store.findDocumentsAsFlatResultSet!(
        "Item",
        { pagination: { pageIndex: 1, pageSize: 5 } },
        5,
      );
      expect(page1.results.bindings.length).toBe(3);
    });
  });
}
