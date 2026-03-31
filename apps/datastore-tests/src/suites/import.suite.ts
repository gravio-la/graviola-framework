/**
 * importDocument / importDocuments contract tests.
 *
 * Imports from one AbstractDatastore into another.
 * Only run when adapter.capabilities.importDocuments === true.
 *
 * The source store is provided by the caller as a factory function so that
 * this suite has no direct dependency on oxigraph (avoiding module resolution
 * issues when running tests from nested directories).
 */
import { describe, test, expect } from "bun:test";
import type { AbstractDatastore } from "@graviola/edb-global-types";

import { entityIRI } from "../schema/testSchema";
import { makeCategory, makeItem } from "../fixtures/testData";

/**
 * A factory that creates a fresh, empty AbstractDatastore to use as the
 * import source. The caller (adapter registry) provides this to decouple
 * the test suite from any specific store implementation.
 */
export type SourceStoreFactory = () => Promise<AbstractDatastore>;

export function runImportSuite(
  getStore: () => AbstractDatastore,
  createSourceStore: SourceStoreFactory,
): void {
  describe("importDocument / importDocuments", () => {
    test("importDocument copies a single entity from source store", async () => {
      const store = getStore();
      const source = await createSourceStore();

      const catId = entityIRI("Category", "imp-cat1");
      const cat = makeCategory("imp-cat1");
      await source.upsertDocument("Category", catId, cat);

      await store.importDocument("Category", catId, source);

      const loaded = await store.loadDocument("Category", catId);
      expect(loaded?.name).toBe("Category imp-cat1");
    });

    test("importDocuments copies all entities of a type", async () => {
      const store = getStore();
      const source = await createSourceStore();

      for (let i = 1; i <= 3; i++) {
        const id = entityIRI("Category", `imp-bulk${i}`);
        await source.upsertDocument(
          "Category",
          id,
          makeCategory(`imp-bulk${i}`),
        );
      }

      await store.importDocuments("Category", source, 10);

      const all = await store.listDocuments("Category");
      expect(all.length).toBe(3);
    });
  });
}
