import { describe, expect, it } from "bun:test";
import {
  compileCalcProfile,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/formula-dependency";
import { evaluateCompiledProfileDeterministic } from "@graviola/formula-runtime";

describe("useComputedFields (pure evaluation parity)", () => {
  it("matches runtime evaluateCompiledProfile output", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);
    const evaluated = evaluateCompiledProfileDeterministic(
      profile,
      gardenFeeSampleData,
    );
    expect(evaluated.annual_fee).toBe(95);
  });
});
