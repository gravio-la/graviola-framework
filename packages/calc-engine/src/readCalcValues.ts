import type { JSONSchema7 } from "json-schema";
import type {
  CompiledProfile,
  CalcReadPlan,
} from "@graviola/formula-dependency";
import { planCalcReads } from "@graviola/formula-dependency";
import type { CalcHostCapabilities } from "@graviola/formula-runtime";
import {
  BROWSER_FORM_HOST,
  evaluateCompiledProfileMany,
  selectLiveEvalSlots,
} from "@graviola/formula-runtime";
import { isMaterializationFresh } from "@graviola/formula-materialization";
import type { StatementNode } from "@graviola/provenance-types";
import { definitionNameFromScope } from "@graviola/json-schema-utils";
import type {
  FreshnessState,
  StoreDocumentsSearchOptions,
} from "@graviola/store-core";
import type { CalcEngineStore } from "./evaluateForRoots";
import { collectEntities, fingerprintForEntity } from "./warm";

export type ReadCalcValuesStore = CalcEngineStore & {
  loadStatements: (
    typeName: string,
    entityIRI: string,
    paths?: string[],
  ) => Promise<Record<string, StatementNode[]>>;
};

export type ReadCalcValuesOptions = {
  host?: CalcHostCapabilities;
};

export type ReadCalcValuesResult = {
  /** `null` when the root entity doesn't exist. */
  value: Record<string, unknown> | null;
  freshness: FreshnessState;
  queriesIssued: number;
  plan: CalcReadPlan;
};

/**
 * Materialized-first read for one root entity.
 *
 * `evaluateForRoots`'s own read (`planCalcReads` selection) is deliberately
 * source-only — it fetches exactly what the evaluator needs, which excludes
 * every materialized *output* property (and therefore its `$stmt` sidecar
 * too, since a store only auto-embeds `$stmt` on an *unfiltered* read, not
 * a narrowed `select`). And a nested `include` (needed to reach Patch/Plot
 * at all) does not reliably carry `$stmt` at those nested levels either
 * (verified empirically: empty/duplicated sidecar arrays for entities
 * reached through `include` — see ESCALATIONS.md). So this does **not**
 * try to get statements "for free" in the same read; it fetches the raw
 * input tree once (`filterMany`, same shape `evaluateForRoots` uses), then
 * calls `store.loadStatements` per entity in that tree — the same
 * per-entity method `warm()` already relies on and the calc-warm contract
 * suite already proves reliable. `StatementNode.value` carries the
 * materialized value directly, so a fresh result never needs a further
 * read of the (unfetched) computed properties.
 *
 * Fresh (every annotated slot on every entity fresh) → materialized values
 * spliced onto the raw doc directly from the loaded statements, no
 * HyperFormula evaluation. Stale or never-materialized → falls back to the
 * same evaluation `evaluateForRoots` performs, over the already-fetched raw
 * doc. Side-effect-free: never calls `writeStatements` — a stale read does
 * not self-heal the store.
 */
export async function readCalcValues(
  store: ReadCalcValuesStore,
  profile: CompiledProfile,
  typeName: string,
  domainSchema: JSONSchema7,
  rootIRI: string,
  options: ReadCalcValuesOptions = {},
): Promise<ReadCalcValuesResult> {
  const plan = planCalcReads(profile, typeName, domainSchema);

  const docs = await store.filterMany(typeName, {
    ...(plan.selection as StoreDocumentsSearchOptions),
    entityIRIs: [rootIRI],
  } as StoreDocumentsSearchOptions);

  const doc = docs[0];
  if (!doc) {
    return { value: null, freshness: "unknown", queriesIssued: 1, plan };
  }

  let queriesIssued = 1;
  let statementsFound = false;
  let allFresh = true;
  const statementsByEntity = new Map<string, Record<string, StatementNode[]>>();

  for (const target of collectEntities(doc)) {
    const relevantSlots = Object.values(profile.slots).filter(
      (slot) => definitionNameFromScope(slot.entityScope) === target.typeName,
    );
    if (relevantSlots.length === 0) continue;

    const fingerprint = fingerprintForEntity(
      profile,
      target.typeName,
      target.entity,
    );
    const paths = relevantSlots.map((slot) => slot.propertyName);
    const stmts = await store.loadStatements(
      target.typeName,
      target.entityIRI,
      paths,
    );
    queriesIssued += 1;
    statementsByEntity.set(target.entityIRI, stmts);

    for (const slot of relevantSlots) {
      const nodes = stmts[slot.propertyName];
      if (!nodes || nodes.length === 0) {
        allFresh = false;
        continue;
      }
      statementsFound = true;
      if (!isMaterializationFresh(nodes, fingerprint)) {
        allFresh = false;
      }
    }
  }

  const freshness: FreshnessState = !statementsFound
    ? "unknown"
    : allFresh
      ? "fresh"
      : "stale";

  if (freshness === "fresh") {
    for (const target of collectEntities(doc)) {
      const stmts = statementsByEntity.get(target.entityIRI);
      if (!stmts) continue;
      for (const [path, nodes] of Object.entries(stmts)) {
        if (nodes[0]) target.entity[path] = nodes[0].value;
      }
    }
    return { value: doc, freshness, queriesIssued, plan };
  }

  const host = options.host ?? BROWSER_FORM_HOST;
  const liveProfile = selectLiveEvalSlots(profile, host);
  const { rows } = evaluateCompiledProfileMany(liveProfile, [doc], {
    report: false,
  });

  return {
    value: rows[0] ?? null,
    freshness,
    queriesIssued,
    plan,
  };
}
