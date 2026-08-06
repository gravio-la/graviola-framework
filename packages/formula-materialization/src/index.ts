import type { CompiledProfile } from "@graviola/formula-dependency";
import { evaluateCompiledProfileDeterministic } from "@graviola/formula-runtime";
import type { GenerationActivity } from "@graviola/provenance-types";
import type { EntityChangeEvent } from "@graviola/store-core";

export type { GenerationActivity } from "@graviola/provenance-types";
export {
  PROV,
  DCT,
  GRA,
  generationActivityToPredicates,
} from "@graviola/provenance-types";

export type MaterializedValue = {
  scope: string;
  value: unknown;
  wasGeneratedBy: GenerationActivity;
};

export type MaterializationPlan = {
  dirtyScope: string;
  orderedScopes: string[];
  values: MaterializedValue[];
};

/** Collect transitive dependents ordered by precomputed stratum (poor-man's IVM). */
export function planInvalidation(
  profile: CompiledProfile,
  dirtyScope: string,
): string[] {
  const visited = new Set<string>();
  const queue: string[] = [dirtyScope];
  const ordered: string[] = [];

  while (queue.length) {
    const scope = queue.shift()!;
    if (visited.has(scope)) continue;
    visited.add(scope);
    const slot = profile.slots[scope];
    if (!slot) continue;
    for (const dep of slot.dependents) {
      if (!visited.has(dep)) queue.push(dep);
    }
  }

  const scopes = [...visited].filter((s) => s !== dirtyScope);
  scopes.sort(
    (a, b) =>
      (profile.slots[a]?.stratum ?? 0) - (profile.slots[b]?.stratum ?? 0),
  );
  return scopes;
}

export function buildMaterializationPlan(
  profile: CompiledProfile,
  data: Record<string, unknown>,
  dirtyScope: string,
  inputFingerprint?: string,
): MaterializationPlan {
  const orderedScopes = planInvalidation(profile, dirtyScope);
  const evaluated = evaluateCompiledProfileDeterministic(profile, data);
  const now = new Date().toISOString();

  const values = orderedScopes
    .map((scope): MaterializedValue | undefined => {
      const slot = profile.slots[scope];
      if (!slot) return undefined;
      const leaf = scope.split("/").pop() ?? scope;
      const value = evaluated[leaf];
      return {
        scope,
        value,
        wasGeneratedBy: {
          formulaId: scope,
          stratum: slot.stratum,
          inputFingerprint,
          generatedAt: now,
        },
      };
    })
    .filter((v): v is MaterializedValue => v !== undefined);

  return { dirtyScope, orderedScopes, values };
}

/** Emit change-bus events for cache invalidation upward. */
export function emitMaterializationChanges(
  emit: (event: EntityChangeEvent) => void,
  entityIRI: string,
  typeName: string,
  typeIRI: string,
  plan: MaterializationPlan,
): void {
  for (const mat of plan.values) {
    emit({
      entityIRI,
      typeName,
      typeIRI,
      changeType: "upsert",
      data: { materializedScope: mat.scope, value: mat.value },
    });
  }
}
