/**
 * Formula portability contract tests.
 *
 * Verifies that compiled calc profiles evaluate identically regardless of
 * datastore backend (portability claim) and that feature-off (no profile) is a no-op.
 */
import { describe, test, expect } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import { evaluateCompiledProfileDeterministic } from "@graviola/formula-runtime";
import type { DatastoreContractStore } from "../types";
import { entityIRI } from "../schema/testSchema";
import { makeItem } from "../fixtures/testData";

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
      const itemId = entityIRI("Item", "formula-off-1");
      const item = makeItem("formula-off-1");

      await store.upsert("Item", itemId, item as never);

      const loaded = await store.loadOne("Item", itemId);
      expect(loaded).toBeTruthy();
      expect(loaded?.name).toBe(item.name);
      expect((loaded as Record<string, unknown>)?.annual_fee).toBeUndefined();
    });

    test("evaluation is independent of active store adapter", async () => {
      const store = getStore();
      const evaluated = evaluateCompiledProfileDeterministic(
        profile,
        gardenFeeSampleData,
      );

      const itemId = entityIRI("Item", "formula-eval-1");
      const item = makeItem("formula-eval-1");
      await store.upsert("Item", itemId, item as never);

      const loaded = await store.loadOne("Item", itemId);
      expect(loaded?.name).toBe(item.name);
      expect(evaluated.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
    });
  });
}
