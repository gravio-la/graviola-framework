import type { JSONSchema7 } from "json-schema";
import type {
  CompiledProfile,
  CalcReadPlan,
} from "@graviola/formula-dependency";
import { planCalcReads } from "@graviola/formula-dependency";
import type {
  CalcHostCapabilities,
  CalcResultCache,
} from "@graviola/formula-runtime";
import {
  BROWSER_FORM_HOST,
  evaluateCompiledProfileMany,
  selectLiveEvalSlots,
} from "@graviola/formula-runtime";
import type { StoreDocumentsSearchOptions } from "@graviola/store-core";

/** Minimal store surface required by the calc engine (Filters facet). */
export type CalcEngineStore = {
  filterMany: (
    typeName: string,
    options?: StoreDocumentsSearchOptions<Record<string, unknown>>,
  ) => Promise<Record<string, unknown>[]>;
};

export type EvaluateForRootsOptions = {
  rootIRIs?: string[];
  where?: StoreDocumentsSearchOptions["where"];
  host?: CalcHostCapabilities;
  cache?: CalcResultCache;
  reportIncomplete?: boolean;
};

export type EvaluateForRootsResult = {
  values: Record<string, unknown>[];
  queriesIssued: number;
  incomplete: Record<string, string[]>;
  plan: CalcReadPlan;
};

/**
 * Plan precise reads for a calc profile, fetch the batch in one query, evaluate
 * with a shared HyperFormula engine. Query count is independent of row count.
 */
export async function evaluateForRoots(
  store: CalcEngineStore,
  profile: CompiledProfile,
  typeName: string,
  domainSchema: JSONSchema7,
  options: EvaluateForRootsOptions = {},
): Promise<EvaluateForRootsResult> {
  const plan = planCalcReads(profile, typeName, domainSchema);
  const host = options.host ?? BROWSER_FORM_HOST;
  const liveProfile = selectLiveEvalSlots(profile, host);

  const docs = await store.filterMany(typeName, {
    ...(plan.selection as StoreDocumentsSearchOptions),
    ...(options.rootIRIs && options.rootIRIs.length > 0
      ? { entityIRIs: options.rootIRIs }
      : {}),
    ...(options.where ? { where: options.where } : {}),
  } as StoreDocumentsSearchOptions);

  const { rows, incomplete } = evaluateCompiledProfileMany(liveProfile, docs, {
    cache: options.cache,
    report: options.reportIncomplete ?? true,
  });

  return {
    values: rows,
    queriesIssued: 1,
    incomplete,
    plan,
  };
}

export { planCalcReads };
export type { CalcReadPlan, CalcHostCapabilities, CalcResultCache };
