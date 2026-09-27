/**
 * Data-volume contract tests — triple-count invariants that catch persistence
 * bugs value-level tests miss (e.g. statement-node history multiplication).
 *
 * Runs only when an adapter exposes `countTriples` (SPARQL/Oxigraph backends).
 */
import { describe, test, expect } from "bun:test";
import {
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import { warm } from "@graviola/calc-engine";
import type { StatementWrite } from "@graviola/provenance-types";
import type {
  DatastoreContractStore,
  DatastoreContractStoreWithCalcWarm,
  DatastoreContractStoreWithStatements,
} from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeCategory, makeItem, makeTag } from "../fixtures/testData";

const GARDEN_IRI = "https://example.org/garden/1";

type DataVolumeSuiteOptions = {
  getStore: () => DatastoreContractStore;
  countTriples: () => Promise<number>;
  getStatementStore?: () => DatastoreContractStoreWithStatements;
  getCalcWarmStore?: () => DatastoreContractStoreWithCalcWarm;
};

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
      source: "data-volume-test",
      generatedAt: "2026-03-01T10:00:00.000Z",
      wasGeneratedBy: {
        formulaId: "test-formula",
        stratum: 1,
        inputFingerprint: `fp-dv-${value}`,
        generatedAt: "2026-03-01T10:00:00.000Z",
      },
      ...overrides,
    },
  };
}

async function measureDelta(
  countTriples: () => Promise<number>,
  action: () => Promise<void>,
): Promise<{ before: number; after: number; delta: number }> {
  const before = await countTriples();
  await action();
  const after = await countTriples();
  return { before, after, delta: after - before };
}

async function seedGarden(
  store: DatastoreContractStoreWithCalcWarm,
): Promise<Record<string, unknown>> {
  const garden = structuredClone(gardenFeeSampleData) as Record<
    string,
    unknown
  >;
  const patch = garden.patch as Record<string, unknown>;
  for (const plot of patch.plots as Array<Record<string, unknown>>) {
    await store.upsert("Plot", plot["@id"] as string, plot as never);
  }
  await store.upsert("Patch", patch["@id"] as string, patch as never);
  await store.upsert("Garden", GARDEN_IRI, garden as never);
  return garden;
}

export function runDataVolumeSuite(options: DataVolumeSuiteOptions): void {
  const { getStore, countTriples, getStatementStore, getCalcWarmStore } =
    options;

  describe("data volume", () => {
    describe("idempotent upsert", () => {
      test("flat entity: second upsert adds 0 triples (Δ=0)", async () => {
        const store = getStore();
        const catId = entityIRI("Category", "dv-flat");
        const cat = makeCategory("dv-flat");

        const first = await measureDelta(countTriples, async () => {
          await store.upsert("Category", catId, cat as never);
        });
        expect(first.delta).toBeGreaterThan(0);

        const second = await measureDelta(countTriples, async () => {
          await store.upsert("Category", catId, cat as never);
        });
        expect(
          second.delta,
          `idempotent flat upsert: before=${second.before} after=${second.after} Δ=${second.delta}`,
        ).toBe(0);
      });

      test("nested relations: second upsert adds 0 triples (Δ=0)", async () => {
        const store = getStore();
        const catId = entityIRI("Category", "dv-nest-cat");
        const tagId = entityIRI("Tag", "dv-nest-tag");
        const itemId = entityIRI("Item", "dv-nest-item");
        const cat = makeCategory("dv-nest-cat");
        const tag = makeTag("dv-nest-tag");
        const item = makeItem("dv-nest-item", {
          category: { "@id": catId },
          tags: [{ "@id": tagId }],
        });

        await store.upsert("Category", catId, cat as never);
        await store.upsert("Tag", tagId, tag as never);

        const first = await measureDelta(countTriples, async () => {
          await store.upsert("Item", itemId, item as never);
        });
        expect(first.delta).toBeGreaterThan(0);

        const second = await measureDelta(countTriples, async () => {
          await store.upsert("Item", itemId, item as never);
        });
        expect(
          second.delta,
          `idempotent nested upsert: before=${second.before} after=${second.after} Δ=${second.delta}`,
        ).toBe(0);
      });
    });

    describe("update in place", () => {
      test("changing one literal keeps triple count constant (Δ=0)", async () => {
        const store = getStore();
        const catId = entityIRI("Category", "dv-update");
        const cat = makeCategory("dv-update");

        await store.upsert("Category", catId, cat as never);

        const updated = { ...cat, name: "Updated Category dv-update" };
        const { delta, before, after } = await measureDelta(
          countTriples,
          async () => {
            await store.upsert("Category", catId, updated as never);
          },
        );
        expect(
          delta,
          `update in place: before=${before} after=${after} Δ=${delta}`,
        ).toBe(0);
      });
    });

    describe("relation change", () => {
      test("replacing relation target does not leave old link (Δ=0 apart from new target)", async () => {
        const store = getStore();
        const catAId = entityIRI("Category", "dv-rel-a");
        const catBId = entityIRI("Category", "dv-rel-b");
        const itemId = entityIRI("Item", "dv-rel-item");
        const catA = makeCategory("dv-rel-a");
        const catB = makeCategory("dv-rel-b");

        await store.upsert("Category", catAId, catA as never);
        await store.upsert("Category", catBId, catB as never);

        const itemWithA = makeItem("dv-rel-item", {
          category: { "@id": catAId },
        });
        await store.upsert("Item", itemId, itemWithA as never);
        const afterFirstLink = await countTriples();

        const itemWithB = makeItem("dv-rel-item", {
          category: { "@id": catBId },
        });
        const { delta, before, after } = await measureDelta(
          countTriples,
          async () => {
            await store.upsert("Item", itemId, itemWithB as never);
          },
        );
        expect(
          delta,
          `relation change: afterFirstLink=${afterFirstLink} before=${before} after=${after} Δ=${delta}`,
        ).toBe(0);
      });
    });

    describe("remove", () => {
      test("remove returns triple count to pre-upsert baseline (no orphaned blank nodes)", async () => {
        const store = getStore();
        const catId = entityIRI("Category", "dv-remove");
        const cat = makeCategory("dv-remove");

        const baseline = await countTriples();
        await store.upsert("Category", catId, cat as never);
        const afterUpsert = await countTriples();
        expect(afterUpsert).toBeGreaterThan(baseline);

        await store.remove("Category", catId);
        const afterRemove = await countTriples();
        expect(
          afterRemove,
          `remove: baseline=${baseline} afterUpsert=${afterUpsert} afterRemove=${afterRemove}`,
        ).toBe(baseline);
      });
    });

    if (getStatementStore) {
      describe("statements (statement-node encoding)", () => {
        test("N distinct writeStatements values grow linearly; repeating last adds 0", async () => {
          const statementStore = getStatementStore();
          const itemId = entityIRI("Item", "dv-stmt");
          await statementStore.upsert(
            "Item",
            itemId,
            makeItem("dv-stmt") as never,
          );

          const perWriteDeltas: number[] = [];
          let prevCount = await countTriples();

          for (let value = 1; value <= 4; value++) {
            const generatedAt = `2026-03-0${value}T10:00:00.000Z`;
            await statementStore.writeStatements("Item", itemId, [
              sampleWrite("price", value, {
                generatedAt,
                wasGeneratedBy: {
                  formulaId: "test-formula",
                  stratum: 1,
                  inputFingerprint: `fp-dv-stmt-${value}`,
                  generatedAt,
                },
              }),
            ]);
            const nextCount = await countTriples();
            perWriteDeltas.push(nextCount - prevCount);
            prevCount = nextCount;
          }

          expect(perWriteDeltas[0]).toBeGreaterThan(0);
          for (let i = 1; i < perWriteDeltas.length; i++) {
            expect(
              perWriteDeltas[i],
              `statement linear growth: deltas=${perWriteDeltas.join(",")}`,
            ).toBe(perWriteDeltas[0]);
          }

          await statementStore.writeStatements("Item", itemId, [
            sampleWrite("price", 4, {
              source: "data-volume-repeat",
              generatedAt: "2026-03-04T10:00:00.000Z",
              wasGeneratedBy: {
                formulaId: "test-formula",
                stratum: 1,
                inputFingerprint: "fp-dv-stmt-4-repeat",
                generatedAt: "2026-03-04T10:00:00.000Z",
              },
            }),
          ]);
          const afterRepeat = await countTriples();
          expect(
            afterRepeat - prevCount,
            `statement repeat last: before=${prevCount} after=${afterRepeat} Δ=${afterRepeat - prevCount}`,
          ).toBe(0);
        });
      });
    }

    if (getCalcWarmStore) {
      describe("calc warm (garden-fee)", () => {
        const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

        test("second warm with skipFresh adds 0 triples (Δ=0)", async () => {
          const calcStore = getCalcWarmStore();
          await seedGarden(calcStore);

          const first = await measureDelta(countTriples, async () => {
            await warm(calcStore, profile, "Garden", gardenFeeSchema, {
              rootIRIs: [GARDEN_IRI],
            });
          });
          expect(first.delta).toBeGreaterThan(0);

          const second = await measureDelta(countTriples, async () => {
            await warm(calcStore, profile, "Garden", gardenFeeSchema, {
              rootIRIs: [GARDEN_IRI],
              skipFresh: true,
            });
          });
          expect(
            second.delta,
            `calc warm skipFresh: before=${second.before} after=${second.after} Δ=${second.delta}`,
          ).toBe(0);
        });

        test("A→B→A re-warm adds bounded triples (no history multiplication)", async () => {
          const calcStore = getCalcWarmStore();
          const garden = await seedGarden(calcStore);
          const plot = (garden.patch as Record<string, unknown>)
            .plots[0] as Record<string, unknown>;

          await warm(calcStore, profile, "Garden", gardenFeeSchema, {
            rootIRIs: [GARDEN_IRI],
          });

          const beforeCycle = await countTriples();

          await calcStore.upsert(
            "Plot",
            plot["@id"] as string,
            {
              ...plot,
              width_m: (plot.width_m as number) * 2,
            } as never,
          );
          await warm(calcStore, profile, "Garden", gardenFeeSchema, {
            rootIRIs: [GARDEN_IRI],
            skipFresh: true,
          });
          const afterB = await countTriples();
          const deltaB = afterB - beforeCycle;

          await calcStore.upsert("Plot", plot["@id"] as string, plot as never);
          await warm(calcStore, profile, "Garden", gardenFeeSchema, {
            rootIRIs: [GARDEN_IRI],
            skipFresh: true,
          });
          const afterA = await countTriples();
          const deltaRestore = afterA - afterB;
          const totalCycleDelta = afterA - beforeCycle;

          // Each re-materialization should replace prior calc statements, not
          // multiply blank-node history. One B-warm observed ~deltaB triples;
          // A→B→A must stay within 2× that per-leg budget (+4 slack for literal churn).
          const perLegUpperBound = Math.max(deltaB, 1) + 4;
          expect(
            deltaRestore,
            `A→B→A restore leg: before=${afterB} after=${afterA} Δ=${deltaRestore} (B leg Δ=${deltaB})`,
          ).toBeLessThanOrEqual(perLegUpperBound);
          expect(
            totalCycleDelta,
            `A→B→A total: before=${beforeCycle} after=${afterA} Δ=${totalCycleDelta} (B leg Δ=${deltaB})`,
          ).toBeLessThanOrEqual(perLegUpperBound * 2);
        });
      });
    }
  });
}
