import type { CompiledProfile } from "@graviola/formula-dependency";
import { scopeToDotPath } from "@graviola/formula-materialization";
import {
  applyStatementWrites,
  remapStatementsForPersistence,
  STATEMENT_JSON_SUFFIX,
  STATEMENT_PERSISTENCE_SUFFIX,
} from "@graviola/statement-meta";
import type { StatementNode, StatementWrite } from "@graviola/provenance-types";
import { calcDebug } from "./calcDebug";

function getByPath(root: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = root;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function isPrimitive(value: unknown): value is string | number | boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/**
 * Demo-only: synthesize statement writes for every compiled slot whose value is a
 * primitive reachable from the evaluated document (skips array-indexed plot paths).
 */
export function buildDemoStatementWrites(
  profile: CompiledProfile,
  evaluated: Record<string, unknown>,
  options?: { agent?: string; inputFingerprint?: string },
): StatementWrite[] {
  const now = new Date().toISOString();
  const writes: StatementWrite[] = [];

  for (const [scope, slot] of Object.entries(profile.slots)) {
    const path = scopeToDotPath(scope);
    // Plot-level scopes resolve to a bare property name — not addressable on Garden root.
    if (!path.includes(".") && slot.entityScope.includes("/Plot")) {
      continue;
    }
    if (!path.includes(".") && slot.entityScope.includes("/Patch")) {
      // Patch fields live under garden.patch.*
      const nestedPath = `patch.${slot.propertyName}`;
      const value = getByPath(evaluated, nestedPath);
      if (!isPrimitive(value)) continue;
      writes.push({
        path: nestedPath,
        value,
        statement: {
          rank: "preferred",
          source: "demo:formula-runtime",
          generatedAt: now,
          wasGeneratedBy: {
            formulaId: scope,
            stratum: slot.stratum,
            inputFingerprint: options?.inputFingerprint,
            agent: options?.agent ?? "urn:graviola:demo-agent",
            generatedAt: now,
          },
        },
      });
      continue;
    }

    const value = getByPath(evaluated, path);
    if (!isPrimitive(value)) continue;
    writes.push({
      path,
      value,
      statement: {
        rank: "preferred",
        source: "demo:formula-runtime",
        generatedAt: now,
        wasGeneratedBy: {
          formulaId: scope,
          stratum: slot.stratum,
          inputFingerprint: options?.inputFingerprint,
          agent: options?.agent ?? "urn:graviola:demo-agent",
          generatedAt: now,
        },
      },
    });
  }

  calcDebug("demo statement writes", writes);
  return writes;
}

export function attachDemoStatements(
  evaluated: Record<string, unknown>,
  profile: CompiledProfile,
  options?: { agent?: string; inputFingerprint?: string },
): Record<string, unknown> {
  const writes = buildDemoStatementWrites(profile, evaluated, options);
  let doc = evaluated;
  for (const write of writes) {
    try {
      doc = applyStatementWrites(doc, [write]);
    } catch (err) {
      calcDebug("skip statement write", write.path, err);
    }
  }
  // Display schema from deriveProvenanceSchema uses persistence keys (`__stmt`).
  return remapStatementsForPersistence(doc) as Record<string, unknown>;
}

export function statementsSiblingKey(propertyName: string): string {
  return `${propertyName}${STATEMENT_JSON_SUFFIX}`;
}

export function readSiblingStatements(
  parent: Record<string, unknown> | undefined,
  propertyName: string,
): StatementNode[] {
  if (!parent) return [];
  const client = parent[`${propertyName}${STATEMENT_JSON_SUFFIX}`];
  const persisted = parent[`${propertyName}${STATEMENT_PERSISTENCE_SUFFIX}`];
  const raw = Array.isArray(client)
    ? client
    : Array.isArray(persisted)
      ? persisted
      : [];
  return raw as StatementNode[];
}

/** Lightweight entity-level demo $meta for gardens without store stamping. */
export function demoEntityMeta(document: Record<string, unknown>): {
  created: string;
  modified: string;
  schemaFingerprint?: string;
  reviewStatus: string;
} {
  const existing = document.$meta as Record<string, unknown> | undefined;
  const now = new Date().toISOString();
  return {
    created: typeof existing?.created === "string" ? existing.created : now,
    modified: now,
    schemaFingerprint:
      typeof existing?.schemaFingerprint === "string"
        ? existing.schemaFingerprint
        : "demo-garden-fee",
    reviewStatus:
      typeof existing?.reviewStatus === "string"
        ? existing.reviewStatus
        : "reviewed",
  };
}
