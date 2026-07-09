import { describe, expect, it } from "bun:test";
import {
  compileCalcProfile,
  gardenFeeSchema,
  gardenFeeSidecar,
  gardenFeeSampleData,
} from "@graviola/formula-dependency";
import { buildMaterializationPlan, planInvalidation } from "./index";

describe("formula-materialization", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("orders dependents by stratum after dirty plot field", () => {
    const scopes = planInvalidation(
      profile,
      "#/definitions/Plot/properties/billable_area",
    );
    expect(scopes.length).toBeGreaterThan(0);
    const strata = scopes.map((s) => profile.slots[s]?.stratum ?? 0);
    expect(strata).toEqual([...strata].sort((a, b) => a - b));
  });

  it("builds materialization plan with provenance", () => {
    const plan = buildMaterializationPlan(
      profile,
      gardenFeeSampleData as Record<string, unknown>,
      "#/definitions/Plot/properties/billable_area",
      "sha256-test",
    );
    expect(plan.values.length).toBeGreaterThan(0);
    expect(plan.values[0]?.wasGeneratedBy.formulaId).toBeDefined();
    expect(plan.values[0]?.wasGeneratedBy.stratum).toBeGreaterThan(0);
  });
});
