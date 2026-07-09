import { describe, expect, it } from "bun:test";
import {
  compileCalcProfile,
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/formula-dependency";
import {
  evaluateCompiledProfile,
  evaluateCompiledProfileDeterministic,
} from "./evaluateCompiledProfile";

describe("evaluateCompiledProfile", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("computes garden-fee chain with same inputs same outputs", () => {
    const first = evaluateCompiledProfileDeterministic(
      profile,
      gardenFeeSampleData,
    );
    const second = evaluateCompiledProfileDeterministic(
      profile,
      gardenFeeSampleData,
    );
    expect(first).toEqual(second);

    const plots = (first.patch as { plots: Record<string, unknown>[] }).plots;
    expect(plots[0]?.billable_area).toBe(gardenFeeExpected.plotBillable[0]);
    expect(plots[1]?.billable_area).toBe(gardenFeeExpected.plotBillable[1]);

    const patch = first.patch as Record<string, unknown>;
    expect(patch.billable_area_total).toBe(gardenFeeExpected.patchTotal);
    expect(first.total_billable).toBe(gardenFeeExpected.gardenTotalBillable);
    expect(first.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
  });

  it("returns computed map for top-level fields", () => {
    const { computed } = evaluateCompiledProfile(profile, gardenFeeSampleData);
    expect(computed.total_billable).toBe(gardenFeeExpected.gardenTotalBillable);
    expect(computed.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
  });
});
