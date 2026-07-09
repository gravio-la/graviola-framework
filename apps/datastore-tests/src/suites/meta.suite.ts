/**
 * Entity-level `$meta` contract tests (P1).
 *
 * Requires adapters to expose `metaStampingStore` from setup when stamping is supported.
 */
import { describe, test, expect } from "bun:test";
import type { DatastoreContractStore } from "../types";
import { entityIRI } from "../schema/testSchema";
import {
  prismaMetaStampingConfig,
  sparqlMetaStampingConfig,
} from "../schema/metaTestConfig";
import { makeCategory, makeItem } from "../fixtures/testData";

type MetaStoreGetter = () => DatastoreContractStore;

export function runMetaSuite(
  getStore: MetaStoreGetter,
  getMetaStore?: MetaStoreGetter,
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
    });
  });
}
