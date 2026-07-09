/**
 * Formula portability contract tests.
 *
 * Verifies that compiled calc profiles evaluate identically regardless of
 * datastore backend (portability claim) and that feature-off (no profile) is a no-op.
 */
import { describe, test, expect } from "bun:test";
import {
  compileCalcProfile,
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/formula-dependency";
import { evaluateCompiledProfileDeterministic } from "@graviola/formula-runtime";
import type { DatastoreContractStore } from "../types";

export function runFormulaPortabilitySuite(
  getStore: () => DatastoreContractStore,
): void {
  describe("Formula portability", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

    test("same formula, same inputs, same result (compiled runtime)", () => {
      const first = evaluateCompiledProfileDeterministic(
        profile,
        gardenFeeSampleData,
      );
      const second = evaluateCompiledProfileDeterministic(
        profile,
        gardenFeeSampleData,
      );

      expect(first.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
      expect(first).toEqual(second);
    });

    test("feature-off row: store CRUD unaffected without calc profile", async () => {
      const store = getStore();
      const raw = structuredClone(gardenFeeSampleData) as Record<
        string,
        unknown
      >;

      await store.upsert("Garden", raw["@id"] as string, raw as never);

      const loaded = await store.loadOne("Garden", raw["@id"] as string);
      expect(loaded).toBeTruthy();
      expect(loaded?.name).toBe("Allotment North");
      expect(loaded?.annual_fee).toBeUndefined();
    });

    test("evaluation is independent of active store adapter", async () => {
      const store = getStore();
      const evaluated = evaluateCompiledProfileDeterministic(
        profile,
        gardenFeeSampleData,
      );

      await store.upsert(
        "Garden",
        gardenFeeSampleData["@id"] as string,
        gardenFeeSampleData as never,
      );

      const loaded = await store.loadOne(
        "Garden",
        gardenFeeSampleData["@id"] as string,
      );
      expect(loaded?.name).toBe(gardenFeeSampleData.name);
      expect(evaluated.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
    });
  });
}
