/**
 * Entity-level `$meta` contract tests (P1).
 *
 * Requires adapters to expose `metaStampingStore` from setup when stamping is supported.
 */
import { describe, test, expect } from "bun:test";
import type { DatastoreContractStoreWithFlat } from "../types";
import { entityIRI } from "../schema/testSchema";
import {
  prismaMetaStampingConfig,
  sparqlMetaStampingConfig,
} from "../schema/metaTestConfig";
import type { MetaStampingStoreVariants } from "../types";
import { makeCategory, makeItem } from "../fixtures/testData";

type MetaStoreGetter = () => DatastoreContractStore;

export function runMetaSuite(
  getStore: MetaStoreGetter,
  getMetaStore?: MetaStoreGetter,
  variants?: MetaStampingStoreVariants,
): void {
  describe("entity $meta", () => {
    describe("feature off", () => {
      test("upsert and load do not add $meta", async () => {
        const store = getStore();
        const catId = entityIRI("Category", "meta-off-cat");
        const cat = makeCategory("meta-off-cat");
        await store.upsert("Category", catId, cat as never);

        const loaded = await store.loadOne("Category", catId);
        expect(loaded).toBeTruthy();
        expect(loaded?.$meta).toBeUndefined();
      });
    });

    if (!getMetaStore) {
      return;
    }

    const metaConfig = () =>
      getMetaStore().storeId?.startsWith("prisma:")
        ? prismaMetaStampingConfig
        : sparqlMetaStampingConfig;

    describe("feature on", () => {
      test("stamps $meta on upsert", async () => {
        const store = getMetaStore();
        const catId = entityIRI("Category", "meta-stamp-cat");
        const cat = makeCategory("meta-stamp-cat");
        await store.upsert("Category", catId, cat as never);

        const loaded = await store.loadOne("Category", catId);
        expect(loaded?.$meta).toBeDefined();
        expect(loaded?.$meta?.schemaFingerprint).toBe(
          metaConfig().schemaFingerprint,
        );
        expect(loaded?.$meta?.schemaVersion).toBe(metaConfig().schemaVersion);
        expect(loaded?.$meta?.modified).toBeTruthy();
        expect(loaded?.$meta?.created).toBeTruthy();
      });

      test("$meta survives round-trip", async () => {
        const store = getMetaStore();
        const catId = entityIRI("Category", "meta-roundtrip-cat");
        const cat = makeCategory("meta-roundtrip-cat");
        await store.upsert("Category", catId, cat as never);
        const first = await store.loadOne("Category", catId);

        await store.upsert("Category", catId, {
          ...cat,
          name: "Updated meta roundtrip",
        } as never);
        const second = await store.loadOne("Category", catId);

        expect(second?.$meta?.created).toBe(first?.$meta?.created);
        expect(second?.name).toBe("Updated meta roundtrip");
      });

      test("client-supplied $meta is stripped and replaced", async () => {
        const store = getMetaStore();
        const catId = entityIRI("Category", "meta-reject-cat");
        const cat = makeCategory("meta-reject-cat");
        await store.upsert("Category", catId, {
          ...cat,
          $meta: {
            modified: "2099-01-01T00:00:00.000Z",
            schemaFingerprint: "client-forged",
            created: "2099-01-01T00:00:00.000Z",
          },
        } as never);

        const loaded = await store.loadOne("Category", catId);
        expect(loaded?.$meta?.schemaFingerprint).toBe(
          metaConfig().schemaFingerprint,
        );
        expect(loaded?.$meta?.modified).not.toBe("2099-01-01T00:00:00.000Z");
      });

      test("nested named entities each carry own $meta", async () => {
        const store = getMetaStore();
        const catId = entityIRI("Category", "meta-nested-cat");
        const itemId = entityIRI("Item", "meta-nested-item");
        const cat = makeCategory("meta-nested-cat");
        const item = makeItem("meta-nested-item", {
          category: { "@id": catId },
        });

        await store.upsert("Category", catId, cat as never);
        await store.upsert("Item", itemId, item as never);

        const loadedItem = await store.loadOne("Item", itemId);
        const loadedCat = await store.loadOne("Category", catId);

        expect(loadedItem?.$meta?.schemaFingerprint).toBe(
          metaConfig().schemaFingerprint,
        );
        expect(loadedCat?.$meta?.schemaFingerprint).toBe(
          metaConfig().schemaFingerprint,
        );
      });

      test("flat result set includes entityMeta lifecycle bindings", async () => {
        const store = getMetaStore() as DatastoreContractStoreWithFlat;
        const catId = entityIRI("Category", "meta-flat-bindings");
        await store.upsert(
          "Category",
          catId,
          makeCategory("meta-flat-bindings") as never,
        );

        const resultSet = await store.findDocumentsAsFlatResultSet(
          "Category",
          {},
        );
        const vars = resultSet.head?.vars ?? [];
        expect(vars).toContain("entityMeta_created_single");
        expect(vars).toContain("entityMeta_modified_single");
      });

      test("flat result set sorts by entityMeta_modified_single desc", async () => {
        const store = getMetaStore() as DatastoreContractStoreWithFlat;
        const olderId = entityIRI("Category", "meta-sort-older");
        const newerId = entityIRI("Category", "meta-sort-newer");

        await store.upsert(
          "Category",
          olderId,
          makeCategory("meta-sort-older") as never,
        );
        await new Promise((resolve) => setTimeout(resolve, 25));
        await store.upsert(
          "Category",
          newerId,
          makeCategory("meta-sort-newer") as never,
        );

        const resultSet = await store.findDocumentsAsFlatResultSet("Category", {
          sorting: [{ id: "entityMeta_modified_single", desc: true }],
        });

        const ids = resultSet.results.bindings.map(
          (binding) => binding.entity?.value,
        );
        expect(ids.indexOf(newerId)).toBeLessThan(ids.indexOf(olderId));
      });
    });

    if (variants?.lifecycleOff) {
      describe("lifecycle off", () => {
        test("stamps fingerprint but not created/modified", async () => {
          const store = () => variants.lifecycleOff!;
          const catId = entityIRI("Category", "meta-lifecycle-off");
          await store().upsert(
            "Category",
            catId,
            makeCategory("meta-lifecycle-off") as never,
          );
          const loaded = await store().loadOne("Category", catId);
          expect(loaded?.$meta?.schemaFingerprint).toBeTruthy();
          expect(loaded?.$meta?.created).toBeUndefined();
          expect(loaded?.$meta?.modified).toBeUndefined();
        });
      });
    }

    if (variants?.application) {
      describe("lifecycle application", () => {
        test("created stable and modified advances on update", async () => {
          const store = () => variants.application!;
          const catId = entityIRI("Category", "meta-lifecycle-app");
          const cat = makeCategory("meta-lifecycle-app");
          await store().upsert("Category", catId, cat as never);
          const first = await store().loadOne("Category", catId);
          await store().upsert("Category", catId, {
            ...cat,
            name: "Updated lifecycle app",
          } as never);
          const second = await store().loadOne("Category", catId);
          expect(second?.$meta?.created).toBe(first?.$meta?.created);
          expect(second?.$meta?.modified).not.toBe(first?.$meta?.modified);
        });
      });
    }

    if (
      getMetaStore().capabilities.profiles?.entityMeta?.lifecycleTimestamps ===
      "database-native"
    ) {
      describe("lifecycle database-native (Prisma)", () => {
        test("created stable, modified advances, client dates ignored", async () => {
          const store = getMetaStore();
          const catId = entityIRI("Category", "meta-lifecycle-native");
          const cat = makeCategory("meta-lifecycle-native");
          await store.upsert("Category", catId, cat as never);
          const first = await store.loadOne("Category", catId);
          await new Promise((r) => setTimeout(r, 15));
          await store.upsert("Category", catId, {
            ...cat,
            name: "Updated native",
            $meta: {
              created: "2099-01-01T00:00:00.000Z",
              modified: "2099-01-01T00:00:00.000Z",
              schemaFingerprint: "forged",
            },
          } as never);
          const second = await store.loadOne("Category", catId);
          expect(second?.$meta?.created).toBe(first?.$meta?.created);
          expect(
            new Date(second?.$meta?.modified ?? 0).getTime(),
          ).toBeGreaterThanOrEqual(
            new Date(first?.$meta?.modified ?? 0).getTime(),
          );
          expect(second?.$meta?.modified).not.toBe("2099-01-01T00:00:00.000Z");
          expect(
            store.capabilities.profiles?.entityMeta?.lifecycleTimestamps,
          ).toBe("database-native");
        });
      });
    }

    if (variants?.sparqlNativeConfig) {
      describe("SPARQL database-native config downgrade", () => {
        test("descriptor reports application stamping", async () => {
          const store = () => variants.sparqlNativeConfig!;
          expect(
            store().capabilities.profiles?.entityMeta?.lifecycleTimestamps,
          ).toBe("application");
          const catId = entityIRI("Category", "meta-sparql-native-cfg");
          await store().upsert(
            "Category",
            catId,
            makeCategory("meta-sparql-native-cfg") as never,
          );
          const loaded = await store().loadOne("Category", catId);
          expect(loaded?.$meta?.created).toBeTruthy();
          expect(loaded?.$meta?.modified).toBeTruthy();
        });
      });
    }
  });
}
