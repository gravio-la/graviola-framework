import { describe, expect, it } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import type { CompiledProfile } from "@graviola/formula-dependency";
import {
  BROWSER_FORM_HOST,
  evaluateCompiledProfile,
} from "@graviola/formula-runtime";
import { partitionLiveSlots } from "./overlayCore";

const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

function withSlotOverride(
  base: CompiledProfile,
  scope: string,
  override: Partial<CompiledProfile["slots"][string]>,
): CompiledProfile {
  return {
    ...base,
    slots: {
      ...base.slots,
      [scope]: { ...base.slots[scope]!, ...override },
    },
  };
}

describe("partitionLiveSlots", () => {
  it("keeps all garden-fee slots live under the browser form host", () => {
    const { liveProfile, skippedSlots } = partitionLiveSlots(
      profile,
      BROWSER_FORM_HOST,
    );
    expect(skippedSlots).toEqual([]);
    expect(Object.keys(liveProfile.slots).sort()).toEqual(
      Object.keys(profile.slots).sort(),
    );
  });

  it("skips eval:server slots on a browser host", () => {
    const scope = "#/definitions/Garden/properties/annual_fee";
    const adjusted = withSlotOverride(profile, scope, { eval: "server" });
    const { liveProfile, skippedSlots } = partitionLiveSlots(
      adjusted,
      BROWSER_FORM_HOST,
    );
    expect(skippedSlots).toEqual([scope]);
    expect(scope in liveProfile.slots).toBe(false);
  });

  it("skips slots whose cost exceeds the host budget", () => {
    const scope = "#/definitions/Garden/properties/total_billable";
    const adjusted = withSlotOverride(profile, scope, { cost: "high" });
    const { skippedSlots } = partitionLiveSlots(adjusted, BROWSER_FORM_HOST);
    expect(skippedSlots).toEqual([scope]);
  });

  it("live narrowing evaluates identically to the full profile when nothing is skipped", () => {
    const { liveProfile } = partitionLiveSlots(profile, BROWSER_FORM_HOST);
    const full = evaluateCompiledProfile(profile, gardenFeeSampleData);
    const live = evaluateCompiledProfile(liveProfile, gardenFeeSampleData);
    expect(live.computed).toEqual(full.computed);
    expect(live.computed.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
  });

  it("skipped slots do not evaluate — dependents see missing input, not a wrong value", () => {
    const scope = "#/definitions/Plot/properties/billable_area";
    const adjusted = withSlotOverride(profile, scope, { eval: "server" });
    const { liveProfile } = partitionLiveSlots(adjusted, BROWSER_FORM_HOST);
    const { data } = evaluateCompiledProfile(liveProfile, gardenFeeSampleData);
    const plots = (data.patch as { plots: Array<Record<string, unknown>> })
      .plots;
    for (const plot of plots) {
      expect(plot.billable_area).toBeUndefined();
    }
  });
});
