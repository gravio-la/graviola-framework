/**
 * searchByLabel contract tests — exact primary-label match semantics of the backing store.
 * Capability-gated: {@link CapabilityDescriptor.searches}.
 */
import { describe, test, expect } from "bun:test";
import type { DatastoreContractStoreWithSearches } from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory } from "../fixtures/testData";

export function runFindByLabelSuite(
  getStore: () => DatastoreContractStoreWithSearches,
): void {
  describe("searchByLabel", () => {
    test("finds documents matching exact label", async () => {
      const store = getStore();
      await store.upsert(
        "Category",
        entityIRI("Category", "lbl-alpha"),
        makeCategory("lbl-alpha", { name: "Electronics" }) as never,
      );
      await store.upsert(
        "Category",
        entityIRI("Category", "lbl-beta"),
        makeCategory("lbl-beta", { name: "Books" }) as never,
      );
      await store.upsert(
        "Category",
        entityIRI("Category", "lbl-gamma"),
        makeCategory("lbl-gamma", { name: "Electronics" }) as never,
      );

      const results = await store.searchByLabel("Category", "Electronics");
      expect(results.length).toBe(2);
    });

    test("returns empty array for no matches", async () => {
      const store = getStore();
      await store.upsert(
        "Category",
        entityIRI("Category", "lbl-only"),
        makeCategory("lbl-only", { name: "Only Category" }) as never,
      );

      const results = await store.searchByLabel("Category", "XYZ_NO_MATCH");
      expect(results.length).toBe(0);
    });
  });
}
