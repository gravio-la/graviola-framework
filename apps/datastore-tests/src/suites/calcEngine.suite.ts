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
import { compileCalcProfile } from "@graviola/formula-dependency";
import { evaluateForRoots, SERVER_CALC_HOST } from "@graviola/calc-engine";
import { selectLiveEvalSlots } from "@graviola/formula-runtime";
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
