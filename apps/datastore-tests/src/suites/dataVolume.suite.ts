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
import { RICH_LIST_FIELDS } from "../schema/richShapeSchema";
import { entityIRI } from "../schema/testSchema";
import { makeCategory, makeItem, makeTag } from "../fixtures/testData";

const GARDEN_IRI = "https://example.org/garden/1";

type DataVolumeSuiteOptions = {
  getStore: () => DatastoreContractStore;
  countTriples: () => Promise<number>;
  getStatementStore?: () => DatastoreContractStoreWithStatements;
  getCalcWarmStore?: () => DatastoreContractStoreWithCalcWarm;
  /** Store bound to `richShapeSchema`: lists, nested objects, relations. */
  getRichShapeStore?: () => DatastoreContractStore;
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
  const {
    getStore,
    countTriples,
    getStatementStore,
    getCalcWarmStore,
    getRichShapeStore,
  } = options;

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

        test("statement nodes are not multiplied by multi-valued properties of the entity", async () => {
          const statementStore = getStatementStore();
          const tagIds = ["dv-mv-a", "dv-mv-b", "dv-mv-c"].map((id) =>
            entityIRI("Tag", id),
          );
          for (const [index, tagId] of tagIds.entries()) {
            await statementStore.upsert("Tag", tagId, {
              "@id": tagId,
              name: `Tag ${index}`,
            } as never);
          }

          // Same statement write on an item without tags and on one with three.
          const deltas: number[] = [];
          for (const [id, tags] of [
            ["dv-stmt-plain", [] as string[]],
            ["dv-stmt-tagged", tagIds],
          ] as const) {
            const itemId = entityIRI("Item", id);
            await statementStore.upsert("Item", itemId, {
              ...makeItem(id),
              tags: tags.map((tagId) => ({ "@id": tagId })),
            } as never);
            const { delta } = await measureDelta(countTriples, () =>
              statementStore.writeStatements("Item", itemId, [
                sampleWrite("price", 5),
              ]),
            );
            deltas.push(delta);

            const again = await measureDelta(countTriples, () =>
              statementStore.writeStatements("Item", itemId, [
                sampleWrite("price", 5),
              ]),
            );
            expect(again.delta, `${id}: repeated write Δ=${again.delta}`).toBe(
              0,
            );
          }
          expect(
            deltas[1],
            `statement write Δ without tags=${deltas[0]}, with 3 tags=${deltas[1]}`,
          ).toBe(deltas[0]);
        });

        test("plain upsert after writeStatements keeps the statements and adds 0 triples (Δ=0)", async () => {
          const statementStore = getStatementStore();
          const itemId = entityIRI("Item", "dv-stmt-upsert");
          await statementStore.upsert(
            "Item",
            itemId,
            makeItem("dv-stmt-upsert") as never,
          );
          await statementStore.writeStatements("Item", itemId, [
            sampleWrite("price", 1, {
              generatedAt: "2026-03-01T10:00:00.000Z",
            }),
          ]);
          await statementStore.writeStatements("Item", itemId, [
            sampleWrite("price", 2, {
              generatedAt: "2026-03-02T10:00:00.000Z",
            }),
          ]);
          const withStatements = await countTriples();

          // What a form save does: load the entity and write it back.
          const loaded = await statementStore.loadOne("Item", itemId);
          for (let round = 1; round <= 3; round++) {
            await statementStore.upsert("Item", itemId, loaded as never);
            const after = await countTriples();
            expect(
              after - withStatements,
              `upsert round ${round}: before=${withStatements} after=${after} Δ=${after - withStatements}`,
            ).toBe(0);
          }

          const rows =
            (await statementStore.loadStatements("Item", itemId, ["price"]))
              .price ?? [];
          expect(rows.map((row) => row.value).sort()).toEqual([1, 2]);
          expect(rows.every((row) => row.source === "data-volume-test")).toBe(
            true,
          );
        });
      });
    }

    if (getRichShapeStore) {
      describe("rich shapes (multi-valued fields, nested objects)", () => {
        const makerId = entityIRI("Maker", "dv-rich-maker");
        const resellerIds = ["dv-rich-r1", "dv-rich-r2"].map((id) =>
          entityIRI("Maker", id),
        );
        const values = (prefix: string, n: number) =>
          Array.from({ length: n }, (_, i) => `${prefix} ${i + 1}`);

        const makeDevice = (
          id: string,
          perList: number,
        ): Record<string, unknown> => ({
          "@id": entityIRI("Device", id),
          name: `Device ${id}`,
          ...Object.fromEntries(
            RICH_LIST_FIELDS.map((field) => [field, values(field, perList)]),
          ),
          maker: { "@id": makerId },
          resellers: resellerIds.map((iri) => ({ "@id": iri })),
          weight: { label: "weight", value: 164, unit: "g" },
          measures: [
            { label: "height", value: 173, unit: "mm" },
            { label: "width", value: 110, unit: "mm" },
          ],
        });

        const seedMakers = async (store: DatastoreContractStore) => {
          for (const [index, iri] of [makerId, ...resellerIds].entries()) {
            await store.upsert("Maker", iri, {
              "@id": iri,
              name: `Maker ${index}`,
            } as never);
          }
        };

        const sorted = (list: unknown) =>
          [...(list as unknown[])].map(String).sort();
        const measureLabels = (doc: Record<string, unknown>) =>
          (doc.measures as Array<{ label: string }>).map((m) => m.label).sort();

        test("an entity with lists, relations and nested objects reads back as it was written", async () => {
          const store = getRichShapeStore();
          await seedMakers(store);
          const device = makeDevice("dv-rich-roundtrip", 3);
          const id = device["@id"] as string;
          await store.upsert("Device", id, device as never);

          const loaded = (await store.loadOne("Device", id)) as Record<
            string,
            unknown
          >;
          expect(loaded.name).toBe(device.name);
          for (const field of RICH_LIST_FIELDS) {
            expect(sorted(loaded[field]), field).toEqual(sorted(device[field]));
          }
          expect((loaded.maker as { "@id": string })["@id"]).toBe(makerId);
          expect(
            sorted(
              (loaded.resellers as Array<{ "@id": string }>).map(
                (r) => r["@id"],
              ),
            ),
          ).toEqual(sorted(resellerIds));
          expect(loaded.weight).toMatchObject({ value: 164, unit: "g" });
          expect(measureLabels(loaded)).toEqual(["height", "width"]);
        });

        test("saving the same document again and again adds 0 triples (Δ=0): nested objects and relations do not multiply", async () => {
          const store = getRichShapeStore();
          await seedMakers(store);
          const device = makeDevice("dv-rich-repeat", 3);
          const id = device["@id"] as string;

          const first = await measureDelta(countTriples, async () => {
            await store.upsert("Device", id, device as never);
          });
          expect(first.delta).toBeGreaterThan(0);

          const afterFirst = await countTriples();
          for (let round = 1; round <= 5; round++) {
            await store.upsert("Device", id, device as never);
            const after = await countTriples();
            expect(
              after - afterFirst,
              `save round ${round}: before=${afterFirst} after=${after} Δ=${after - afterFirst}`,
            ).toBe(0);
          }

          // What a form does: load, then save what was loaded.
          for (let round = 1; round <= 3; round++) {
            const loaded = await store.loadOne("Device", id);
            await store.upsert("Device", id, loaded as never);
            const after = await countTriples();
            expect(
              after - afterFirst,
              `load-and-save round ${round}: before=${afterFirst} after=${after} Δ=${after - afterFirst}`,
            ).toBe(0);
          }

          const loaded = (await store.loadOne("Device", id)) as Record<
            string,
            unknown
          >;
          expect(measureLabels(loaded)).toEqual(["height", "width"]);
          expect((loaded.resellers as unknown[]).length).toBe(2);
        });

        test("a change costs exactly its own triples, whatever else the entity holds", async () => {
          const store = getRichShapeStore();
          await seedMakers(store);
          const device = makeDevice("dv-rich-change", 3);
          const id = device["@id"] as string;
          await store.upsert("Device", id, device as never);
          const base = await countTriples();
          const save = async (doc: Record<string, unknown>) => {
            await store.upsert("Device", id, doc as never);
            return (await countTriples()) - base;
          };

          // One more value in one list: one more triple.
          expect(
            await save({
              ...device,
              formats: [...(device.formats as string[]), "formats 4"],
            }),
            "one list value added",
          ).toBe(1);
          // One value fewer than at the start: one triple fewer.
          expect(
            await save({
              ...device,
              formats: (device.formats as string[]).slice(0, 2),
            }),
            "one list value removed",
          ).toBe(-1);
          // A changed value inside the nested object replaces it in place.
          expect(
            await save({
              ...device,
              weight: { label: "weight", value: 170, unit: "g" },
            }),
            "nested value changed",
          ).toBe(0);
          // A relation replaced by another one.
          expect(
            await save({
              ...device,
              maker: { "@id": resellerIds[0] },
            }),
            "relation target replaced",
          ).toBe(0);

          // One nested object fewer, then back: no orphaned blank nodes either way.
          const oneMeasure = await save({
            ...device,
            measures: (device.measures as unknown[]).slice(0, 1),
          });
          expect(oneMeasure, "one nested object removed").toBeLessThan(0);
          expect(await save(device), "nested object added back").toBe(0);
          // The second nested object costs what the first one cost to remove.
          const noMeasure = await save({ ...device, measures: [] });
          expect(noMeasure, "both nested objects removed").toBe(2 * oneMeasure);
          expect(await save(device), "back to the original").toBe(0);
        });

        test("remove takes the nested objects along: triple count returns to the baseline", async () => {
          const store = getRichShapeStore();
          await seedMakers(store);
          const baseline = await countTriples();
          const device = makeDevice("dv-rich-remove", 3);
          const id = device["@id"] as string;
          await store.upsert("Device", id, device as never);
          await store.upsert("Device", id, device as never);
          expect(await countTriples()).toBeGreaterThan(baseline);

          await store.remove("Device", id);
          const after = await countTriples();
          expect(after, `remove: baseline=${baseline} after=${after}`).toBe(
            baseline,
          );
        });

        test("the cost of saving and loading grows with the number of values, not with their product", async () => {
          const store = getRichShapeStore();
          await seedMakers(store);
          // 5 lists × 7 values: 35 values, but 16 807 combinations of them.
          const device = makeDevice("dv-rich-wide", 7);
          const id = device["@id"] as string;

          const timed = async <T>(action: () => Promise<T>) => {
            const start = performance.now();
            const result = await action();
            return { result, ms: performance.now() - start };
          };

          const firstSave = await timed(() =>
            store.upsert("Device", id, device as never),
          );
          const afterFirst = await countTriples();
          const secondSave = await timed(() =>
            store.upsert("Device", id, device as never),
          );
          expect(
            (await countTriples()) - afterFirst,
            "second save of the wide entity",
          ).toBe(0);
          const load = await timed(() => store.loadOne("Device", id));

          const loaded = load.result as Record<string, unknown>;
          for (const field of RICH_LIST_FIELDS) {
            expect(sorted(loaded[field]), field).toEqual(sorted(device[field]));
          }
          expect(measureLabels(loaded)).toEqual(["height", "width"]);

          const budgetMs = 2000;
          const timings = `first save ${firstSave.ms.toFixed(0)} ms, second save ${secondSave.ms.toFixed(0)} ms, load ${load.ms.toFixed(0)} ms`;
          expect(secondSave.ms, timings).toBeLessThan(budgetMs);
          expect(load.ms, timings).toBeLessThan(budgetMs);
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
