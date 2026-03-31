/**
 * iterableImplementation contract tests.
 *
 * Async iterable variants of listDocuments / findDocuments.
 * Only run when adapter.capabilities.iterables === true.
 */
import { describe, test, expect } from "bun:test";
import type { AbstractDatastore } from "@graviola/edb-global-types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory } from "../fixtures/testData";

export function runIterableSuite(getStore: () => AbstractDatastore): void {
  describe("iterableImplementation", () => {
    test("listDocuments iterable yields all documents", async () => {
      const store = getStore();
      for (let i = 1; i <= 4; i++) {
        await store.upsertDocument(
          "Category",
          entityIRI("Category", `iter${i}`),
          makeCategory(`iter${i}`),
        );
      }

      const iterResult =
        await store.iterableImplementation!.listDocuments("Category");
      expect(iterResult.amount).toBe(4);

      const collected: any[] = [];
      for await (const doc of iterResult.iterable) {
        collected.push(doc);
      }
      expect(collected.length).toBe(4);
    });

    test("findDocuments iterable respects search term", async () => {
      const store = getStore();
      await store.upsertDocument(
        "Category",
        entityIRI("Category", "iter-alpha"),
        makeCategory("iter-alpha", { name: "Alpha" }),
      );
      await store.upsertDocument(
        "Category",
        entityIRI("Category", "iter-beta"),
        makeCategory("iter-beta", { name: "Beta" }),
      );

      const iterResult = await store.iterableImplementation!.findDocuments(
        "Category",
        {
          search: "alpha",
        },
      );

      const collected: any[] = [];
      for await (const doc of iterResult.iterable) {
        collected.push(doc);
      }
      expect(collected.length).toBe(1);
      expect(collected[0].name).toBe("Alpha");
    });
  });
}
