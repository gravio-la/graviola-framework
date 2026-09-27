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
import toPath from "lodash-es/toPath";
import type { CalcWarmResult } from "@graviola/store-core";
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

export type WarmResult = CalcWarmResult;

type CollectedPathValue = {
  value: unknown;
  ownerId?: string;
};

function entityId(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const id = (value as Record<string, unknown>)["@id"];
  return typeof id === "string" ? id : undefined;
}

function collectPathValues(
  doc: Record<string, unknown>,
  path: string,
): { values: CollectedPathValue[]; arrayDerived: boolean } {
  const segments = toPath(path);
  let arrayDerived = false;

  const visit = (
    value: unknown,
    segmentIndex: number,
    ownerId?: string,
  ): CollectedPathValue[] => {
    if (Array.isArray(value)) {
      arrayDerived = true;
      return value.flatMap((item) =>
        visit(item, segmentIndex, entityId(item) ?? ownerId),
      );
    }
    if (segmentIndex === segments.length) {
      return [{ value, ownerId }];
    }
    if (!value || typeof value !== "object") {
      return [{ value: undefined, ownerId }];
    }
    const record = value as Record<string, unknown>;
    return visit(
      record[segments[segmentIndex]!],
      segmentIndex + 1,
      entityId(record) ?? ownerId,
    );
  };

  return { values: visit(doc, 0, entityId(doc)), arrayDerived };
}

function stableJson(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? String(value);
  }
  if (Array.isArray(value)) {
    return `[${value
      .map((item) => stableJson(item))
      .sort()
      .join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const id = entityId(record);
  if (id) return JSON.stringify(id);

  const entries = Object.entries(record)
    .filter(([key]) => !key.endsWith("$stmt"))
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
    .join(",")}}`;
}

function fingerprintSourceValue(
  doc: Record<string, unknown>,
  path: string,
): string {
  const { values, arrayDerived } = collectPathValues(doc, path);
  const ordered = values
    .map(({ value, ownerId }) => ({
      ownerId,
      serialized: stableJson(value),
    }))
    .sort((left, right) => {
      const leftKey = left.ownerId
        ? `0:${left.ownerId}`
        : `1:${left.serialized}`;
      const rightKey = right.ownerId
        ? `0:${right.ownerId}`
        : `1:${right.serialized}`;
      return (
        leftKey.localeCompare(rightKey) ||
        left.serialized.localeCompare(right.serialized)
      );
    });

  if (arrayDerived || ordered.length !== 1) {
    return `[${ordered.map(({ serialized }) => serialized).join(",")}]`;
  }
  return ordered[0]!.serialized;
}

export function fingerprintForEntity(
  profile: CompiledProfile,
  typeName: string,
  doc: Record<string, unknown>,
): string {
  const parts: string[] = [];
  for (const slot of Object.values(profile.slots) as CompiledSlot[]) {
    if (definitionNameFromScope(slot.entityScope) !== typeName) continue;
    for (const src of slot.sources) {
      parts.push(`${src}=${fingerprintSourceValue(doc, src)}`);
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
