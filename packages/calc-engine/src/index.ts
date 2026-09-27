export { evaluateForRoots, planCalcReads } from "./evaluateForRoots";
export type {
  CalcEngineStore,
  EvaluateForRootsOptions,
  EvaluateForRootsResult,
  CalcReadPlan,
  CalcHostCapabilities,
  CalcResultCache,
} from "./evaluateForRoots";

export { warm, collectEntities, fingerprintForEntity } from "./warm";
export type {
  WarmOptions,
  WarmResult,
  WarmStore,
  EntityWriteTarget,
} from "./warm";

export { readCalcValues, readCalcValuesMany } from "./readCalcValues";
export type {
  ReadCalcValuesOptions,
  ReadCalcValuesReport,
  ReadCalcValuesStore,
} from "./readCalcValues";

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

export { BROWSER_FORM_HOST } from "@graviola/formula-runtime";

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
