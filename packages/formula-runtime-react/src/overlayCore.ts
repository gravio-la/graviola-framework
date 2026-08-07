import type { CompiledProfile } from "@graviola/formula-dependency";
import {
  selectLiveEvalSlots,
  type CalcHostCapabilities,
} from "@graviola/formula-runtime";

export type LiveSlotPartition = {
  /** Profile narrowed to slots the host may evaluate live. */
  liveProfile: CompiledProfile;
  /** Scopes excluded by the capability context (server-side / warm-time). */
  skippedSlots: string[];
};

/**
 * Pure core of `useLiveCalcOverlay`: split a compiled profile into the
 * live-evaluable narrowing and the skipped remainder for a host context.
 */
export function partitionLiveSlots(
  profile: CompiledProfile,
  host: CalcHostCapabilities,
): LiveSlotPartition {
  const liveProfile = selectLiveEvalSlots(profile, host);
  const skippedSlots = Object.keys(profile.slots).filter(
    (scope) => !(scope in liveProfile.slots),
  );
  return { liveProfile, skippedSlots };
}
