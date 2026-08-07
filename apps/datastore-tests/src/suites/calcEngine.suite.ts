/**
 * Calc-engine contract: plan → one batched filterMany → evaluate.
 * Capability-gated on `filters`. Uses an in-memory filterMany stand-in for
 * garden-fee values (domain schema is not the contract Item schema) and
 * asserts the real store's entityIRIs batch costs one query.
 */
import { describe, test, expect } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import {
  compileCalcProfile,
  planCalcReads,
} from "@graviola/formula-dependency";
import { evaluateForRoots, SERVER_CALC_HOST } from "@graviola/calc-engine";
import {
  entityTypeFromData,
  selectLiveEvalSlots,
} from "@graviola/formula-runtime";
import { entityIRI } from "../schema/testSchema";
import type { DatastoreContractStoreWithFilters } from "../types";
import { makeItem } from "../fixtures/testData";

export function runCalcEngineSuite(
  getStore: () => DatastoreContractStoreWithFilters,
): void {
  describe("Calc engine", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

    test("evaluateForRoots issues one query and matches garden-fee expected", async () => {
      let calls = 0;
      const memory = {
        filterMany: async () => {
          calls += 1;
          return [gardenFeeSampleData as Record<string, unknown>];
        },
      };
      const result = await evaluateForRoots(
        memory,
        profile,
        "Garden",
        gardenFeeSchema,
        { rootIRIs: ["https://example.org/garden/1"] },
      );
      expect(calls).toBe(1);
      expect(result.queriesIssued).toBe(1);
      expect(result.values[0]?.annual_fee).toBe(
        gardenFeeExpected.gardenAnnualFee,
      );
      expect(result.plan.depth).toBe(2);
    });

    test("store filterMany({ entityIRIs }) is one query for N subjects", async () => {
      const store = getStore();
      const a = entityIRI("Item", "calc-a");
      const b = entityIRI("Item", "calc-b");
      await store.upsert("Item", a, makeItem("calc-a", { name: "A" }));
      await store.upsert("Item", b, makeItem("calc-b", { name: "B" }));

      const rows = await store.filterMany("Item", {
        entityIRIs: [a, b],
      });
      expect(rows.length).toBe(2);
      const names = rows.map((r: { name?: string }) => r.name).sort();
      expect(names).toEqual(["A", "B"]);
    });

    test("SERVER_CALC_HOST placement keeps all garden-fee slots", () => {
      const live = selectLiveEvalSlots(profile, SERVER_CALC_HOST);
      expect(Object.keys(live.slots).length).toBe(
        Object.keys(profile.slots).length,
      );
    });
  });
}

/**
 * Real-store calc contract: the garden-fee profile must evaluate from a cold
 * store read — seeded through the store's own `upsert`, read back through the
 * store's own `filterMany` with the `planCalcReads` selection. This is the
 * read-shape conformance check: the store must return the nested entity tree
 * (with `@id`/`@type` identity on every named entity) that the evaluator
 * dispatches on. Runs only when an adapter exposes a `calcStore` bound to the
 * garden-fee fixture schema.
 */
export function runCalcEngineRealStoreSuite(
  getCalcStore: () => DatastoreContractStoreWithFilters,
): void {
  describe("Calc engine (real store, garden-fee)", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);
    const GARDEN_IRI = "https://example.org/garden/1";

    /**
     * Upsert every named entity separately: a store write covers the entity's
     * own CBD plus links to nested named entities — nested content is not
     * cascaded (CBD is the write granularity).
     */
    const seedGarden = async (store: DatastoreContractStoreWithFilters) => {
      const garden = gardenFeeSampleData as unknown as Record<string, any>;
      const patch = garden.patch as Record<string, any>;
      for (const plot of patch.plots as Array<Record<string, any>>) {
        await store.upsert("Plot", plot["@id"], plot);
      }
      await store.upsert("Patch", patch["@id"], patch);
      await store.upsert("Garden", GARDEN_IRI, garden);
    };

    test("read shape: planCalcReads selection returns the tree the evaluator needs", async () => {
      const store = getCalcStore();
      await seedGarden(store);

      const plan = planCalcReads(profile, "Garden", gardenFeeSchema);
      expect(plan.unreachable).toEqual([]);

      const rows = await store.filterMany("Garden", {
        ...(plan.selection as object),
        entityIRIs: [GARDEN_IRI],
      } as never);
      expect(rows.length).toBe(1);

      const garden = rows[0] as Record<string, any>;
      // Identity: the evaluator dispatches by `@type` on every named entity.
      expect(entityTypeFromData(garden)).toBe("Garden");
      expect(garden.fee_rate_per_sqm).toBe(2.5);

      const patch = garden.patch as Record<string, any>;
      expect(patch).toBeTruthy();
      expect(entityTypeFromData(patch)).toBe("Patch");

      const plots = patch.plots as Array<Record<string, any>>;
      expect(Array.isArray(plots)).toBe(true);
      expect(plots.length).toBe(2);
      for (const plot of plots) {
        expect(entityTypeFromData(plot)).toBe("Plot");
        expect(typeof plot.width_m).toBe("number");
        expect(typeof plot.length_m).toBe("number");
      }
    });

    test("evaluateForRoots computes garden-fee from a cold real-store read", async () => {
      const store = getCalcStore();
      await seedGarden(store);

      const result = await evaluateForRoots(
        store,
        profile,
        "Garden",
        gardenFeeSchema,
        { rootIRIs: [GARDEN_IRI] },
      );

      expect(result.queriesIssued).toBe(1);
      expect(result.values.length).toBe(1);
      const garden = result.values[0] as Record<string, any>;
      expect(garden.total_billable).toBe(gardenFeeExpected.gardenTotalBillable);
      expect(garden.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);

      const plots = (garden.patch as Record<string, any>)?.plots as Array<
        Record<string, any>
      >;
      expect(plots?.map((p) => p.billable_area).sort()).toEqual(
        [...gardenFeeExpected.plotBillable].sort(),
      );
      expect((garden.patch as Record<string, any>)?.billable_area_total).toBe(
        gardenFeeExpected.patchTotal,
      );
    });
  });
}
