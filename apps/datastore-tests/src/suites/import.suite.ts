/**
 * importOne / importMany contract tests — {@link Imports} capability.
 *
 * The source Store is built by an adapter-provided factory (see `createSourceOxigraphStore`)
 * so this suite avoids a hard-coded dependency on a particular implementation.
 */
import { describe, test, expect } from "bun:test";
import type {
  DatastoreContractStoreWithImports,
  ImportSeedStore,
} from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory } from "../fixtures/testData";

export type ImportSourceStoreFactory = () => Promise<ImportSeedStore>;

export function runImportSuite(
  getStore: () => DatastoreContractStoreWithImports,
  createSourceStore: ImportSourceStoreFactory,
): void {
  describe("importOne / importMany", () => {
    test("importOne copies a single entity from source Store", async () => {
      const store = getStore();
      const source = await createSourceStore();

      const catId = entityIRI("Category", "imp-cat1");
      const cat = makeCategory("imp-cat1");
      await source.upsert("Category", catId, cat as never);

      await store.importOne("Category", catId, source);

      const loaded = await store.loadOne("Category", catId);
      expect(loaded?.name).toBe("Category imp-cat1");
    });

    test("importMany copies all entities of a type", async () => {
      const store = getStore();
      const source = await createSourceStore();

      for (let i = 1; i <= 3; i++) {
        const id = entityIRI("Category", `imp-bulk${i}`);
        await source.upsert(
          "Category",
          id,
          makeCategory(`imp-bulk${i}`) as never,
        );
      }

      await store.importMany("Category", source, 10);

      const all = await store.list("Category");
      expect(all.length).toBe(3);
    });
  });
}
