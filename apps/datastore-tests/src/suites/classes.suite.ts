/**
 * getClasses contract tests.
 *
 * getClasses(entityIRI) returns the type IRIs for a given entity.
 * Only run when adapter.capabilities.getClasses === true.
 */
import { describe, test, expect } from "bun:test";
import type { AbstractDatastore } from "@graviola/edb-global-types";
import { entityIRI, typeNameToTypeIRI } from "../schema/testSchema";
import { makeCategory, makeItem } from "../fixtures/testData";

export function runClassesSuite(getStore: () => AbstractDatastore): void {
  describe("getClasses", () => {
    test("returns type IRI for a known entity", async () => {
      const store = getStore();
      const catId = entityIRI("Category", "cls-cat1");
      await store.upsertDocument("Category", catId, makeCategory("cls-cat1"));

      const classes = await store.getClasses!(catId);
      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBeGreaterThan(0);
      expect(classes).toContain(typeNameToTypeIRI("Category"));
    });

    test("returns correct type IRI for Item", async () => {
      const store = getStore();
      const itemId = entityIRI("Item", "cls-item1");
      await store.upsertDocument("Item", itemId, makeItem("cls-item1"));

      const classes = await store.getClasses!(itemId);
      expect(classes).toContain(typeNameToTypeIRI("Item"));
    });

    test("does not confuse types (Category entity has no Item type)", async () => {
      const store = getStore();
      const catId = entityIRI("Category", "cls-cat2");
      await store.upsertDocument("Category", catId, makeCategory("cls-cat2"));

      const classes = await store.getClasses!(catId);
      expect(classes).not.toContain(typeNameToTypeIRI("Item"));
    });
  });
}
