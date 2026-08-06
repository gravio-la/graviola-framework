/**
 * Fact-level `$stmt` contract tests (P3 slice 1).
 */
import { describe, test, expect } from "bun:test";
import {
  buildStatementWrites,
  isMaterializationFresh,
} from "@graviola/formula-materialization";
import type { StatementWrite } from "@graviola/provenance-types";
import { STATEMENT_JSON_SUFFIX } from "@graviola/statement-meta";
import type {
  DatastoreContractStore,
  DatastoreContractStoreWithStatements,
} from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeItem } from "../fixtures/testData";

type StoreGetter = () => DatastoreContractStore;
type StatementStoreGetter = () => DatastoreContractStoreWithStatements;

function stmtKey(prop: string): string {
  return `${prop}${STATEMENT_JSON_SUFFIX}`;
}

function sampleWrite(
  path: string,
  value: number,
  overrides: Partial<StatementWrite["statement"]> = {},
): StatementWrite {
  return {
    path,
    value,
    statement: {
      rank: "preferred",
      source: "contract-test",
      generatedAt: "2026-03-01T10:00:00.000Z",
      wasGeneratedBy: {
        formulaId: "test-formula",
        stratum: 1,
        inputFingerprint: "fp-contract-1",
        generatedAt: "2026-03-01T10:00:00.000Z",
      },
      ...overrides,
    },
  };
}

export function runStatementMetaSuite(
  getStore: StoreGetter,
  getStatementStore?: StatementStoreGetter,
  getStatementStoreRdf12?: StatementStoreGetter,
): void {
  describe("fact-level $stmt", () => {
    test("feature off: documents contain no $stmt keys and statements capability is absent", async () => {
      const store = getStore();
      expect(store.capabilities.statements).toBeUndefined();

      const itemId = entityIRI("Item", "stmt-off");
      await store.upsert("Item", itemId, makeItem("stmt-off") as never);
      const loaded = await store.loadOne("Item", itemId);
      expect(loaded?.[stmtKey("price")]).toBeUndefined();
    });

    const runAgainstStatementStore = (
      label: string,
      getter: StatementStoreGetter,
      options?: { expectEmbeddedOnLoad?: boolean },
    ) => {
      describe(label, () => {
        test("descriptor advertises statementMeta encoding", () => {
          const store = getter();
          expect(store.capabilities.statements).toBe(true);
          expect(
            store.capabilities.profiles?.statementMeta?.encoding,
          ).toBeDefined();
        });

        test("writeStatements + loadStatements round-trip", async () => {
          const store = getter();
          const itemId = entityIRI("Item", "stmt-roundtrip");
          await store.upsert(
            "Item",
            itemId,
            makeItem("stmt-roundtrip") as never,
          );

          const write = sampleWrite("price", 42);
          await store.writeStatements("Item", itemId, [write]);

          const loaded = await store.loadStatements("Item", itemId, ["price"]);
          const rows = loaded.price ?? [];
          expect(rows.length).toBe(1);
          expect(rows[0]?.value).toBe(42);
          expect(rows[0]?.rank).toBe("preferred");
          expect(rows[0]?.source).toBe("contract-test");
          expect(rows[0]?.wasGeneratedBy?.inputFingerprint).toBe(
            "fp-contract-1",
          );
        });

        test("dual assertion: truthy value visible via loadOne after writeStatements", async () => {
          const store = getter();
          const itemId = entityIRI("Item", "stmt-dual");
          await store.upsert(
            "Item",
            itemId,
            makeItem("stmt-dual", { price: 1 }) as never,
          );
          await store.writeStatements("Item", itemId, [
            sampleWrite("price", 99),
          ]);

          const loaded = await store.loadOne("Item", itemId);
          expect(loaded?.price).toBe(99);
        });

        test("same value re-written replaces the statement (one element, updated metadata)", async () => {
          const store = getter();
          const itemId = entityIRI("Item", "stmt-replace");
          await store.upsert("Item", itemId, makeItem("stmt-replace") as never);

          await store.writeStatements("Item", itemId, [
            sampleWrite("price", 10, { source: "first" }),
          ]);
          await store.writeStatements("Item", itemId, [
            sampleWrite("price", 10, { source: "second" }),
          ]);

          const rows = (await store.loadStatements("Item", itemId, ["price"]))
            .price;
          expect(rows?.length).toBe(1);
          expect(rows?.[0]?.source).toBe("second");
        });

        test("two different values accumulate two statements; truthy shows the last written", async () => {
          const store = getter();
          const itemId = entityIRI("Item", "stmt-multi");
          await store.upsert("Item", itemId, makeItem("stmt-multi") as never);

          await store.writeStatements("Item", itemId, [
            sampleWrite("price", 10),
          ]);
          await store.writeStatements("Item", itemId, [
            sampleWrite("price", 20),
          ]);

          const rows = (await store.loadStatements("Item", itemId, ["price"]))
            .price;
          expect(rows?.length).toBe(2);
          const loaded = await store.loadOne("Item", itemId);
          expect(loaded?.price).toBe(20);
        });

        test("client-supplied $stmt on plain upsert is stripped", async () => {
          const store = getter();
          const itemId = entityIRI("Item", "stmt-strip");
          await store.upsert("Item", itemId, {
            ...makeItem("stmt-strip"),
            [stmtKey("price")]: [
              {
                value: 777,
                source: "client-forged",
              },
            ],
          } as never);

          const viaFacet = await store.loadStatements("Item", itemId, [
            "price",
          ]);
          expect(viaFacet.price?.length ?? 0).toBe(0);
        });

        test('writeStatements without an "always" policy throws', async () => {
          const store = getter();
          const itemId = entityIRI("Item", "stmt-policy");
          await store.upsert("Item", itemId, makeItem("stmt-policy") as never);

          await expect(
            store.writeStatements("Item", itemId, [
              {
                path: "name",
                value: "blocked",
                statement: { source: "nope" },
              },
            ]),
          ).rejects.toThrow(/always/);
        });

        test("materialization freshness: statement written via buildStatementWrites is fresh for its fingerprint and stale for another", async () => {
          const store = getter();
          const itemId = entityIRI("Item", "stmt-fresh");
          await store.upsert("Item", itemId, makeItem("stmt-fresh") as never);

          const plan = {
            dirtyScope: "#/definitions/Item/properties/price",
            orderedScopes: ["#/definitions/Item/properties/price"],
            values: [
              {
                scope: "#/definitions/Item/properties/price",
                value: 55,
                wasGeneratedBy: {
                  formulaId: "#/definitions/Item/properties/price",
                  stratum: 2,
                  inputFingerprint: "fp-live",
                  generatedAt: "2026-03-02T12:00:00.000Z",
                },
              },
            ],
          };
          await store.writeStatements(
            "Item",
            itemId,
            buildStatementWrites(plan),
          );

          const rows =
            (await store.loadStatements("Item", itemId, ["price"])).price ?? [];
          expect(isMaterializationFresh(rows, "fp-live")).toBe(true);
          expect(isMaterializationFresh(rows, "fp-stale")).toBe(false);
        });

        if (options?.expectEmbeddedOnLoad) {
          test("statements arrive embedded in loadOne under <prop>$stmt", async () => {
            const store = getter();
            const itemId = entityIRI("Item", "stmt-embed");
            await store.upsert("Item", itemId, makeItem("stmt-embed") as never);
            await store.writeStatements("Item", itemId, [
              sampleWrite("price", 33),
            ]);

            const loaded = await store.loadOne("Item", itemId);
            const embedded = loaded?.[stmtKey("price")] as
              | Array<{ value: number }>
              | undefined;
            expect(embedded?.length).toBe(1);
            expect(embedded?.[0]?.value).toBe(33);
          });
        }
      });
    };

    if (getStatementStore) {
      runAgainstStatementStore("statement-node encoding", getStatementStore, {
        expectEmbeddedOnLoad: true,
      });
    }

    if (getStatementStoreRdf12) {
      runAgainstStatementStore("rdf-12 encoding", getStatementStoreRdf12);
    }
  });
}

/** Meta + statements combined store tests (optional per adapter). */
export function runStatementMetaWithEntityMetaSuite(
  getStatementMetaStore?: StatementStoreGetter,
): void {
  if (!getStatementMetaStore) return;

  describe("fact-level $stmt with entity $meta", () => {
    test("statement write advances $meta.modified when stamping is enabled", async () => {
      const store = getStatementMetaStore();
      const itemId = entityIRI("Item", "stmt-meta-mod");
      await store.upsert("Item", itemId, makeItem("stmt-meta-mod") as never);
      const before = await store.loadOne("Item", itemId);
      const modifiedBefore = before?.$meta?.modified;

      await new Promise((r) => setTimeout(r, 5));

      await store.writeStatements("Item", itemId, [sampleWrite("price", 12)]);

      const after = await store.loadOne("Item", itemId);
      expect(after?.$meta?.modified).toBeTruthy();
      if (modifiedBefore) {
        expect(after?.$meta?.modified).not.toBe(modifiedBefore);
      }
    });
  });
}
