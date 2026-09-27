import type { CompiledProfile } from "@graviola/formula-dependency";
import { evaluateCompiledProfileDeterministic } from "@graviola/formula-runtime";
import type {
  GenerationActivity,
  StatementNode,
  StatementWrite,
} from "@graviola/provenance-types";
import type { EntityChangeEvent } from "@graviola/store-core";

export type { GenerationActivity } from "@graviola/provenance-types";
export {
  PROV,
  DCT,
  GRA,
  generationActivityToPredicates,
} from "@graviola/provenance-types";
export type { StatementNode, StatementWrite } from "@graviola/provenance-types";

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

const PROPERTIES_MARKER = "/properties/";

/** JSON Schema scope pointer → dot path on entity documents. */
export function scopeToDotPath(scope: string): string {
  const idx = scope.indexOf(PROPERTIES_MARKER);
  if (idx === -1) {
    const parts = scope.split("/");
    return parts[parts.length - 1] ?? scope;
  }
  const afterFirst = scope.slice(idx + PROPERTIES_MARKER.length);
  return afterFirst.split(PROPERTIES_MARKER).join(".");
}

function assertStatementValue(
  value: unknown,
  scope: string,
): asserts value is StatementWrite["value"] {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    throw new Error(
      `buildStatementWrites: non-primitive value at scope ${scope}`,
    );
  }
}

/** Map a materialization plan to dual-assertion statement writes. */
export function buildStatementWrites(
  plan: MaterializationPlan,
  options?: { agent?: string },
): StatementWrite[] {
  return plan.values.map((mat) => {
    assertStatementValue(mat.value, mat.scope);
    const wasGeneratedBy: GenerationActivity = {
      ...mat.wasGeneratedBy,
      ...(options?.agent ? { agent: options.agent } : {}),
    };
    return {
      path: scopeToDotPath(mat.scope),
      value: mat.value,
      statement: {
        generatedAt: mat.wasGeneratedBy.generatedAt,
        wasGeneratedBy,
      },
    };
  });
}

/** Persist a plan through a statements-capable store (dual assertion), then emit change events. */
export async function materializePlan(
  store: {
    writeStatements: (
      typeName: string,
      entityIRI: string,
      writes: StatementWrite[],
    ) => Promise<void>;
    emit?: (event: EntityChangeEvent) => void;
  },
  typeName: string,
  typeIRI: string,
  entityIRI: string,
  plan: MaterializationPlan,
  options?: { agent?: string },
): Promise<void> {
  await store.writeStatements(
    typeName,
    entityIRI,
    buildStatementWrites(plan, options),
  );
  if (store.emit) {
    emitMaterializationChanges(store.emit, entityIRI, typeName, typeIRI, plan);
  }
}

/**
 * The statement that currently holds a computed slot's value: the latest
 * generatedAt wins; missing or equal timestamps fall back to the last node in
 * array order. Older nodes are kept as history and must not be used.
 */
export function currentStatement(
  statements: StatementNode[],
): StatementNode | undefined {
  if (statements.length === 0) return undefined;
  return statements.reduce((latest, statement) => {
    const latestGeneratedAt =
      latest.generatedAt === undefined
        ? undefined
        : Date.parse(latest.generatedAt);
    const generatedAt =
      statement.generatedAt === undefined
        ? undefined
        : Date.parse(statement.generatedAt);
    if (
      latestGeneratedAt === undefined ||
      generatedAt === undefined ||
      generatedAt >= latestGeneratedAt
    ) {
      return statement;
    }
    return latest;
  });
}

/** Cache-validity check for one computed slot against its current statement. */
export function isMaterializationFresh(
  statements: StatementNode[],
  currentInputFingerprint: string,
): boolean {
  return (
    currentStatement(statements)?.wasGeneratedBy?.inputFingerprint ===
    currentInputFingerprint
  );
}
