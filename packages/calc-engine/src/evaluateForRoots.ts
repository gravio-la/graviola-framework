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
  /**
   * Optional deep load — preferred when the calc plan needs relation hops
   * (SPARQL `filterMany` often returns shallow documents).
   */
  loadOne?: (
    typeName: string,
    entityIRI: string,
  ) => Promise<Record<string, unknown> | null>;
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

function stampShortType(
  doc: Record<string, unknown>,
  typeName: string,
): Record<string, unknown> {
  if (typeof doc["@type"] === "string" && doc["@type"].length > 0) {
    return doc;
  }
  return { ...doc, "@type": typeName };
}

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

  let docs = await store.filterMany(typeName, {
    ...(plan.selection as StoreDocumentsSearchOptions),
    ...(options.rootIRIs && options.rootIRIs.length > 0
      ? { entityIRIs: options.rootIRIs }
      : {}),
    ...(options.where ? { where: options.where } : {}),
  } as StoreDocumentsSearchOptions);

  let queriesIssued = 1;

  // Deepen via loadOne when the plan needs relation hops and the store exposes
  // it — SPARQL filterMany is often shallow (no partOf.name for CONCATENATE).
  if (plan.depth > 0 && typeof store.loadOne === "function") {
    const iris =
      options.rootIRIs && options.rootIRIs.length > 0
        ? options.rootIRIs
        : docs
            .map((d) => d["@id"])
            .filter((id): id is string => typeof id === "string");
    const loaded: Record<string, unknown>[] = [];
    for (const iri of iris) {
      const doc = await store.loadOne(typeName, iri);
      queriesIssued += 1;
      if (doc) loaded.push(doc);
    }
    docs = loaded;
  }

  docs = docs.map((d) => stampShortType(d, typeName));

  const { rows, incomplete } = evaluateCompiledProfileMany(liveProfile, docs, {
    cache: options.cache,
    report: options.reportIncomplete ?? true,
  });

  return {
    values: rows,
    queriesIssued,
    incomplete,
    plan,
  };
}

export { planCalcReads };
export type { CalcReadPlan, CalcHostCapabilities, CalcResultCache };
