/**
 * streamList contract tests — async iteration over structured entities.
 * Capability-gated: {@link CapabilityDescriptor.streams}.
 */
import { describe, test, expect } from "bun:test";
import type { DatastoreContractStoreWithStreams } from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory } from "../fixtures/testData";

export function runIterableSuite(
  getStore: () => DatastoreContractStoreWithStreams,
): void {
  describe("streamList", () => {
    test("async iterable yields all documents", async () => {
      const store = getStore();
      for (let i = 1; i <= 4; i++) {
        await store.upsert(
          "Category",
          entityIRI("Category", `iter${i}`),
          makeCategory(`iter${i}`) as never,
        );
      }

      const collected: unknown[] = [];
      for await (const doc of store.streamList("Category")) {
        collected.push(doc);
      }
      expect(collected.length).toBe(4);
    });

    test("async iterable respects search term via StoreListQuery", async () => {
      const store = getStore();
      await store.upsert(
        "Category",
        entityIRI("Category", "iter-alpha"),
        makeCategory("iter-alpha", { name: "Alpha" }) as never,
      );
      await store.upsert(
        "Category",
        entityIRI("Category", "iter-beta"),
        makeCategory("iter-beta", { name: "Beta" }) as never,
      );

      const collected: { name?: string }[] = [];
      for await (const doc of store.streamList("Category", undefined, {
        search: "alpha",
      })) {
        collected.push(doc as { name?: string });
      }
      expect(collected.length).toBe(1);
      expect(collected[0].name).toBe("Alpha");
    });
  });
}
