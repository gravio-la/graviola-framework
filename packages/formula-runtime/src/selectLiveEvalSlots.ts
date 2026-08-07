import type {
  CompiledProfile,
  CompiledSlot,
  CostHint,
} from "@graviola/formula-dependency";

const COST_RANK: Record<CostHint, number> = {
  static: 0,
  low: 1,
  medium: 2,
  high: 3,
};

/** Minimal host capability context for live (synchronous) calc overlays. */
export type CalcHostCapabilities = {
  placement: "browser" | "server";
  /** Max cost class allowed for synchronous live overlay. */
  maxLiveCost: CostHint;
};

/** Browser form/detail default: allow up to medium-cost live overlays. */
export const BROWSER_FORM_HOST: CalcHostCapabilities = {
  placement: "browser",
  maxLiveCost: "medium",
};

function costAllowed(cost: CostHint, maxLiveCost: CostHint): boolean {
  return COST_RANK[cost] <= COST_RANK[maxLiveCost];
}

function slotAllowedForLive(
  slot: CompiledSlot,
  host: CalcHostCapabilities,
): boolean {
  const placement = slot.eval ?? "auto";
  if (host.placement === "browser" && placement === "server") {
    return false;
  }
  if (!costAllowed(slot.cost, host.maxLiveCost)) {
    return false;
  }
  return true;
}

/**
 * Return a compiled profile containing only slots eligible for live evaluation
 * on the given host. `evaluateCompiledProfile` / `useComputedFields` stay unchanged.
 */
export function selectLiveEvalSlots(
  profile: CompiledProfile,
  host: CalcHostCapabilities,
): CompiledProfile {
  const slots: CompiledProfile["slots"] = {};
  for (const [scope, slot] of Object.entries(profile.slots)) {
    if (slotAllowedForLive(slot, host)) {
      slots[scope] = slot;
    }
  }
  return {
    schemaIdentity: profile.schemaIdentity,
    slots,
  };
}
