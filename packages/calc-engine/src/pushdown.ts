/**
 * Store-native aggregate pushdown (Stage 5).
 *
 * Capability-flagged: backends without SUM/AVG fall back to JS evaluation
 * via `evaluateForRoots`. SPARQL `SUM` over VALUES-bound subjects and Prisma
 * `aggregate` are not yet wired into `sparql-schema` typed-filter CONSTRUCT —
 * this module defines the seam, a pure JS reference aggregator for
 * differential equality tests, and the placement host profile.
 */

import type {
  CompiledProfile,
  CompiledSlot,
} from "@graviola/formula-dependency";
import type { CalcHostCapabilities } from "@graviola/formula-runtime";
import get from "lodash-es/get";

export type AggregatePushdownCapability = {
  /** Store advertises native SUM/AVG/COUNT over filtered subjects. */
  canPushdownAggregates: boolean;
  /**
   * Optional native evaluator. When absent but `canPushdownAggregates` is true,
   * callers should still fall back to JS (capability without implementation).
   */
  evaluateAggregate?: (
    request: PushdownAggregateRequest,
  ) => Promise<number | undefined>;
};

export type PushdownAggregateRequest = {
  slot: CompiledSlot;
  scope: string;
  subjectIRIs: string[];
  /** Pre-fetched entity documents for the JS reference / fallback path. */
  entities?: Record<string, unknown>[];
};

export type PushdownAggregateResult = {
  scope: string;
  value: number;
  pushed: boolean;
};

/**
 * Pure JS reference for aggregate slots — used as the equality oracle against
 * store-native pushdown (and as the Stage 2 fallback).
 */
export function computeAggregateInJs(
  slot: CompiledSlot,
  entity: Record<string, unknown>,
): number {
  if (!slot.aggregate) return 0;
  const collection = get(entity, slot.aggregate.over);
  if (!Array.isArray(collection)) return 0;
  if (slot.aggregate.type === "count") return collection.length;
  const nums = collection.map((item) => {
    if (!slot.aggregate!.field) return Number(item);
    const v = get(item, slot.aggregate!.field);
    return typeof v === "number" ? v : Number(v) || 0;
  });
  if (slot.aggregate.type === "sum") {
    return nums.reduce((a, b) => a + b, 0);
  }
  if (slot.aggregate.type === "avg") {
    return nums.length === 0
      ? 0
      : nums.reduce((a, b) => a + b, 0) / nums.length;
  }
  return 0;
}

/**
 * Attempt store-native evaluation of aggregate slots. Returns `pushed: false`
 * when the capability is absent or the native evaluator declines — callers must
 * fall back to `evaluateForRoots` / JS HyperFormula path.
 */
export async function tryPushdownAggregates(
  capability: AggregatePushdownCapability,
  _profile: CompiledProfile,
  requests: PushdownAggregateRequest[],
  _host?: CalcHostCapabilities,
): Promise<PushdownAggregateResult[]> {
  const out: PushdownAggregateResult[] = [];
  for (const req of requests) {
    if (!capability.canPushdownAggregates || !capability.evaluateAggregate) {
      out.push({ scope: req.scope, value: 0, pushed: false });
      continue;
    }
    const native = await capability.evaluateAggregate(req);
    if (native === undefined) {
      out.push({ scope: req.scope, value: 0, pushed: false });
      continue;
    }
    out.push({ scope: req.scope, value: native, pushed: true });
  }
  return out;
}

/**
 * Differential helper: for each request with entities, compare native pushdown
 * (when pushed) to {@link computeAggregateInJs}.
 */
export async function assertPushdownEqualsJs(
  capability: AggregatePushdownCapability,
  profile: CompiledProfile,
  requests: PushdownAggregateRequest[],
): Promise<{ scope: string; native: number; js: number; equal: boolean }[]> {
  const pushed = await tryPushdownAggregates(capability, profile, requests);
  return requests.map((req, i) => {
    const entity = req.entities?.[0] ?? {};
    const js = computeAggregateInJs(req.slot, entity);
    const native = pushed[i]!;
    return {
      scope: req.scope,
      native: native.pushed ? native.value : js,
      js,
      equal: (native.pushed ? native.value : js) === js,
    };
  });
}

/** Server host profile for Stage 5 placement. */
export const SERVER_CALC_HOST: CalcHostCapabilities = {
  placement: "server",
  maxLiveCost: "high",
};
