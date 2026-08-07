import type {
  CompiledProfile,
  CompiledSlot,
} from "@graviola/formula-dependency";
import { definitionNameFromScope } from "@graviola/json-schema-utils";
import get from "lodash-es/get";
import uniq from "lodash-es/uniq";
import {
  entityTypeFromData,
  evaluateCompiledProfile,
  HyperFormulaAdapter,
  type FormulaEvaluationContext,
} from "./evaluateCompiledProfile";

export type CalcResultCache = Map<string, unknown>;

export type EvaluateManyOptions = {
  /** Optional result cache keyed by fingerprint (honours slot.cache === "static"). */
  cache?: CalcResultCache;
  /** When true, collect scopes whose aggregate collection was missing. */
  report?: boolean;
  context?: FormulaEvaluationContext;
};

export type EvaluateManyResult = {
  rows: Record<string, unknown>[];
  /** entityIRI → incomplete aggregate scopes */
  incomplete: Record<string, string[]>;
};

function fingerprintSources(
  entity: Record<string, unknown>,
  sources: string[],
): string {
  return sources
    .map((path) => {
      try {
        return JSON.stringify(get(entity, path));
      } catch {
        return "∅";
      }
    })
    .join("|");
}

function cacheKey(
  schemaIdentity: string,
  scope: string,
  entity: Record<string, unknown>,
  slot: CompiledSlot,
): string {
  const iri =
    typeof entity["@id"] === "string" ? entity["@id"] : JSON.stringify(entity);
  return `${schemaIdentity}::${scope}::${iri}::${fingerprintSources(entity, slot.sources)}`;
}

function collectIncompleteAggregates(
  root: Record<string, unknown>,
  profile: CompiledProfile,
): string[] {
  const incomplete: string[] = [];
  for (const [scope, slot] of Object.entries(profile.slots)) {
    if (!slot.aggregate) continue;
    const typeName = definitionNameFromScope(slot.entityScope);
    if (!typeName) continue;

    const visit = (node: unknown): void => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const item of node) visit(item);
        return;
      }
      const record = node as Record<string, unknown>;
      if (entityTypeFromData(record) === typeName) {
        const collection = get(record, slot.aggregate!.over);
        if (!Array.isArray(collection)) {
          incomplete.push(scope);
        }
      }
      for (const val of Object.values(record)) {
        if (val && typeof val === "object") visit(val);
      }
    };
    visit(root);
  }
  return uniq(incomplete);
}

/**
 * Evaluate a compiled profile over many documents, reusing one HyperFormula
 * engine for the whole batch.
 */
export function evaluateCompiledProfileMany(
  profile: CompiledProfile,
  docs: Record<string, unknown>[],
  options: EvaluateManyOptions = {},
): EvaluateManyResult {
  const schemaId =
    profile.schemaIdentity.fingerprint ||
    profile.schemaIdentity.schema ||
    "unknown";
  const incomplete: Record<string, string[]> = {};
  const rows: Record<string, unknown>[] = [];
  const adapter = new HyperFormulaAdapter();

  try {
    for (const doc of docs) {
      const result = evaluateCompiledProfile(
        profile,
        doc,
        options.context,
        adapter,
      );
      const iri =
        typeof result.data["@id"] === "string"
          ? result.data["@id"]
          : `anon:${rows.length}`;

      if (options.report) {
        const missing = collectIncompleteAggregates(result.data, profile);
        if (missing.length > 0) incomplete[iri] = missing;
      }

      if (options.cache) {
        for (const [scope, slot] of Object.entries(profile.slots)) {
          if (slot.cache !== "static") continue;
          const key = cacheKey(schemaId, scope, doc, slot);
          const typeName = definitionNameFromScope(slot.entityScope);
          const rootType = entityTypeFromData(result.data);
          if (!(typeName && rootType === typeName)) continue;

          if (options.cache.has(key)) {
            result.data[slot.propertyName] = options.cache.get(key);
          } else {
            options.cache.set(key, result.data[slot.propertyName]);
          }
        }
      }

      rows.push(result.data);
    }
  } finally {
    adapter.destroy();
  }

  return { rows, incomplete };
}
