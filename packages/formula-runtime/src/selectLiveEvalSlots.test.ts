import { describe, expect, it } from "bun:test";
import { gardenFeeSchema, gardenFeeSidecar } from "@graviola/calc-fixtures";
import {
  compileCalcProfile,
  type CompiledProfile,
  type CompiledSlot,
} from "@graviola/formula-dependency";
import { BROWSER_FORM_HOST, selectLiveEvalSlots } from "./selectLiveEvalSlots";

function withSlotOverrides(
  profile: CompiledProfile,
  overrides: Record<string, Partial<CompiledSlot>>,
): CompiledProfile {
  const slots = { ...profile.slots };
  for (const [scope, patch] of Object.entries(overrides)) {
    const base = slots[scope];
    if (!base) continue;
    slots[scope] = { ...base, ...patch };
  }
  return { ...profile, slots };
}

describe("selectLiveEvalSlots", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("keeps garden-fee slots under browser medium budget", () => {
    const live = selectLiveEvalSlots(profile, BROWSER_FORM_HOST);
    expect(Object.keys(live.slots).sort()).toEqual(
      Object.keys(profile.slots).sort(),
    );
  });

  it("skips eval:server slots in the browser", () => {
    const scope = Object.keys(profile.slots)[0]!;
    const patched = withSlotOverrides(profile, {
      [scope]: { eval: "server" },
    });
    const live = selectLiveEvalSlots(patched, BROWSER_FORM_HOST);
    expect(live.slots[scope]).toBeUndefined();
    expect(Object.keys(live.slots).length).toBe(
      Object.keys(profile.slots).length - 1,
    );
  });

  it("skips cost:high when maxLiveCost is medium", () => {
    const scope = Object.keys(profile.slots)[0]!;
    const patched = withSlotOverrides(profile, {
      [scope]: { cost: "high", eval: "auto" },
    });
    const live = selectLiveEvalSlots(patched, BROWSER_FORM_HOST);
    expect(live.slots[scope]).toBeUndefined();
  });

  it("allows high cost on server host with maxLiveCost high", () => {
    const scope = Object.keys(profile.slots)[0]!;
    const patched = withSlotOverrides(profile, {
      [scope]: { cost: "high", eval: "server" },
    });
    const live = selectLiveEvalSlots(patched, {
      placement: "server",
      maxLiveCost: "high",
    });
    expect(live.slots[scope]).toBeDefined();
  });
});
