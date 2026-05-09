/**
 * resolveTypes (RDF classes) contract tests.
 * Capability-gated: {@link CapabilityDescriptor.resolves}.
 */
import { describe, test, expect } from "bun:test";
import type { DatastoreContractStoreWithResolves } from "../types";
import { entityIRI, typeNameToTypeIRI } from "../schema/testSchema";
import { makeCategory, makeItem } from "../fixtures/testData";

export function runClassesSuite(
  getStore: () => DatastoreContractStoreWithResolves,
): void {
  describe("resolveTypes", () => {
    test("returns type IRI for a known entity", async () => {
      const store = getStore();
      const catId = entityIRI("Category", "cls-cat1");
      await store.upsert("Category", catId, makeCategory("cls-cat1") as never);

      const classes = await store.resolveTypes(catId);
      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBeGreaterThan(0);
      expect(classes).toContain(typeNameToTypeIRI("Category"));
    });

    test("returns correct type IRI for Item", async () => {
      const store = getStore();
      const itemId = entityIRI("Item", "cls-item1");
      await store.upsert("Item", itemId, makeItem("cls-item1") as never);

      const classes = await store.resolveTypes(itemId);
      expect(classes).toContain(typeNameToTypeIRI("Item"));
    });

    test("does not confuse types (Category entity has no Item type)", async () => {
      const store = getStore();
      const catId = entityIRI("Category", "cls-cat2");
      await store.upsert("Category", catId, makeCategory("cls-cat2") as never);

      const classes = await store.resolveTypes(catId);
      expect(classes).not.toContain(typeNameToTypeIRI("Item"));
    });
  });
}
