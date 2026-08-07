import type { JSONSchema7 } from "json-schema";
import type {
  CompiledProfile,
  CompiledSlot,
} from "@graviola/formula-dependency";
import { definitionNameFromScope } from "@graviola/json-schema-utils";
import {
  buildStatementWrites,
  isMaterializationFresh,
  scopeToDotPath,
  type MaterializationPlan,
  type MaterializedValue,
} from "@graviola/formula-materialization";
import type { StatementNode } from "@graviola/provenance-types";
import { entityTypeFromData } from "@graviola/formula-runtime";
import get from "lodash-es/get";
import {
  evaluateForRoots,
  type EvaluateForRootsOptions,
} from "./evaluateForRoots";

export type WarmStore = {
  filterMany: (
    typeName: string,
    options?: Record<string, unknown>,
  ) => Promise<Record<string, unknown>[]>;
  writeStatements: (
    typeName: string,
    entityIRI: string,
    writes: ReturnType<typeof buildStatementWrites>,
  ) => Promise<void>;
  loadStatements?: (
    typeName: string,
    entityIRI: string,
    paths?: string[],
  ) => Promise<Record<string, StatementNode[]>>;
  typeNameToTypeIRI?: (typeName: string) => string;
};

export type WarmOptions = EvaluateForRootsOptions & {
  agent?: string;
  /** Skip writes when existing statements match the input fingerprint. */
  skipFresh?: boolean;
};

export type WarmResult = {
  warmed: number;
  skippedFresh: number;
  writesIssued: number;
  queriesIssued: number;
};

export function fingerprintForEntity(
  profile: CompiledProfile,
  typeName: string,
  doc: Record<string, unknown>,
): string {
  const parts: string[] = [];
  for (const slot of Object.values(profile.slots) as CompiledSlot[]) {
    if (definitionNameFromScope(slot.entityScope) !== typeName) continue;
    for (const src of slot.sources) {
      parts.push(`${src}=${JSON.stringify(get(doc, src))}`);
    }
  }
  return parts.sort().join("&");
}

export type EntityWriteTarget = {
  typeName: string;
  entityIRI: string;
  entity: Record<string, unknown>;
};

/**
 * Collect every named entity in the evaluated tree (depth-first).
 * Entities without `@type` are skipped — callers must type the graph.
 */
export function collectEntities(
  root: Record<string, unknown>,
): EntityWriteTarget[] {
  const out: EntityWriteTarget[] = [];
  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    const record = node as Record<string, unknown>;
    const typeName = entityTypeFromData(record);
    const entityIRI =
      typeof record["@id"] === "string" ? record["@id"] : undefined;
    if (typeName && entityIRI) {
      out.push({ typeName, entityIRI, entity: record });
    }
    for (const val of Object.values(record)) {
      if (val && typeof val === "object") visit(val);
    }
  };
  visit(root);
  return out;
}

function planForEntity(
  profile: CompiledProfile,
  typeName: string,
  entity: Record<string, unknown>,
  inputFingerprint: string,
): MaterializationPlan {
  const now = new Date().toISOString();
  const orderedScopes = Object.entries(profile.slots)
    .filter(
      ([, slot]) => definitionNameFromScope(slot.entityScope) === typeName,
    )
    .sort((a, b) => a[1].stratum - b[1].stratum || a[0].localeCompare(b[0]))
    .map(([scope]) => scope);

  const values: MaterializedValue[] = [];
  for (const scope of orderedScopes) {
    const slot = profile.slots[scope]!;
    const value = entity[slot.propertyName];
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      continue;
    }
    values.push({
      scope,
      value,
      wasGeneratedBy: {
        formulaId: scope,
        stratum: slot.stratum,
        inputFingerprint,
        generatedAt: now,
      },
    });
  }

  return {
    dirtyScope: orderedScopes[0] ?? "",
    orderedScopes,
    values,
  };
}

/**
 * Batched warm pass: evaluate → writeStatements with inputFingerprint per
 * owning entity. Re-warm with skipFresh skips entities whose fingerprints
 * already match.
 */
export async function warm(
  store: WarmStore,
  profile: CompiledProfile,
  typeName: string,
  domainSchema: JSONSchema7,
  options: WarmOptions = {},
): Promise<WarmResult> {
  const evaluated = await evaluateForRoots(
    store,
    profile,
    typeName,
    domainSchema,
    options,
  );

  let warmed = 0;
  let skippedFresh = 0;
  let writesIssued = 0;

  for (const doc of evaluated.values) {
    for (const target of collectEntities(doc)) {
      const fingerprint = fingerprintForEntity(
        profile,
        target.typeName,
        target.entity,
      );
      const plan = planForEntity(
        profile,
        target.typeName,
        target.entity,
        fingerprint,
      );
      if (plan.values.length === 0) continue;

      if (options.skipFresh !== false && store.loadStatements) {
        const paths = plan.values.map((v) => scopeToDotPath(v.scope));
        const existing = await store.loadStatements(
          target.typeName,
          target.entityIRI,
          paths,
        );
        const allFresh =
          Object.keys(existing).length > 0 &&
          Object.values(existing).every((stmts) =>
            isMaterializationFresh(stmts, fingerprint),
          );
        if (allFresh) {
          skippedFresh += 1;
          continue;
        }
      }

      const writes = buildStatementWrites(plan, { agent: options.agent });
      await store.writeStatements(target.typeName, target.entityIRI, writes);
      writesIssued += writes.length;
      warmed += 1;
    }
  }

  return {
    warmed,
    skippedFresh,
    writesIssued,
    queriesIssued: evaluated.queriesIssued,
  };
}
