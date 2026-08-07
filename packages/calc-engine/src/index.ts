export { evaluateForRoots, planCalcReads } from "./evaluateForRoots";
export type {
  CalcEngineStore,
  EvaluateForRootsOptions,
  EvaluateForRootsResult,
  CalcReadPlan,
  CalcHostCapabilities,
  CalcResultCache,
} from "./evaluateForRoots";

export { warm } from "./warm";
export type { WarmOptions, WarmResult, WarmStore } from "./warm";

export {
  subscribeCalcInvalidation,
  dirtyScopesForChange,
  createSparqlAffectedPlanner,
  climbAffectedRoots,
  discoverRelationEdges,
} from "./delta";
export type {
  AffectedInstancePlanner,
  CalcInvalidationHandle,
  DirtySlotSet,
  RelationEdge,
} from "./delta";

export {
  tryPushdownAggregates,
  computeAggregateInJs,
  assertPushdownEqualsJs,
  SERVER_CALC_HOST,
} from "./pushdown";
export type {
  AggregatePushdownCapability,
  PushdownAggregateRequest,
  PushdownAggregateResult,
} from "./pushdown";
