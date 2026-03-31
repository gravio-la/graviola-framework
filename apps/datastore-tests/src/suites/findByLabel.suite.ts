/**
 * findDocumentsByLabel contract tests.
 * Only run when adapter.capabilities.findDocumentsByLabel === true.
 */
import { describe, test, expect } from "bun:test";
import type { AbstractDatastore } from "@graviola/edb-global-types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory } from "../fixtures/testData";

export function runFindByLabelSuite(getStore: () => AbstractDatastore): void {
  describe("findDocumentsByLabel", () => {
    test("finds documents matching exact label", async () => {
      const store = getStore();
      // findDocumentsByLabel uses exact match on the primary label field
      await store.upsertDocument(
        "Category",
        entityIRI("Category", "lbl-alpha"),
        makeCategory("lbl-alpha", { name: "Electronics" }),
      );
      await store.upsertDocument(
        "Category",
        entityIRI("Category", "lbl-beta"),
        makeCategory("lbl-beta", { name: "Books" }),
      );
      await store.upsertDocument(
        "Category",
        entityIRI("Category", "lbl-gamma"),
        makeCategory("lbl-gamma", { name: "Electronics" }),
      );

      const results = await store.findDocumentsByLabel!(
        "Category",
        "Electronics",
      );
      expect(results.length).toBe(2);
    });

    test("returns empty array for no matches", async () => {
      const store = getStore();
      await store.upsertDocument(
        "Category",
        entityIRI("Category", "lbl-only"),
        makeCategory("lbl-only", { name: "Only Category" }),
      );

      const results = await store.findDocumentsByLabel!(
        "Category",
        "XYZ_NO_MATCH",
      );
      expect(results.length).toBe(0);
    });
  });
}
