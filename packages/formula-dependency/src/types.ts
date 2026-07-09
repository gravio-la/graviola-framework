import type { SchemaIdentity } from "@graviola/json-schema-utils";

export const CALC_PROFILE_SCHEMA_IRI = "https://graviola.top/calc-profile/v1";

export type CalcBinding = {
  path?: string;
  context?: string;
};

export type CalcAggregate = {
  type: "sum" | "count" | "avg";
  over: string;
  field?: string;
};

export type CalcProfileSlot = {
  formula?: string;
  bindings?: Record<string, CalcBinding>;
  aggregate?: CalcAggregate;
  eval?: "client" | "server" | "auto";
  cache?: string;
};

export type CalcProfileSidecar = {
  $schema?: string;
  appliesTo: SchemaIdentity & { sidecarSchema?: string };
  slots: Record<string, CalcProfileSlot>;
};

export type CostHint = "static" | "low" | "medium" | "high";

export type CompiledSlot = {
  stratum: number;
  dependents: string[];
  sources: string[];
  cost: CostHint;
  formula?: string;
  bindings?: Record<string, CalcBinding>;
  aggregate?: CalcAggregate;
  eval?: "client" | "server" | "auto";
  /** JSON Pointer scope of the owning named entity (CBD boundary). */
  entityScope: string;
  /** Property key on the entity instance. */
  propertyName: string;
};

export type CompiledProfile = {
  schemaIdentity: SchemaIdentity;
  slots: Record<string, CompiledSlot>;
};

export type BoundaryProfile = {
  /** Scopes whose formulas may only reference slots with stratum ≤ 1. */
  authRuleScopes?: string[];
  /** Scopes treated as completeness-sensitive (aggregates crossing CBD). */
  completenessSlots?: string[];
};

export type CompileCalcProfileError =
  | {
      kind: "fingerprint-mismatch";
      expected: string;
      actual: string;
      message: string;
    }
  | {
      kind: "dangling-scope";
      scope: string;
      message: string;
    }
  | {
      kind: "invalid-binding";
      scope: string;
      path: string;
      message: string;
    }
  | {
      kind: "cycle";
      chain: string[];
      message: string;
    }
  | {
      kind: "auth-boundary-violation";
      scope: string;
      referencedScope: string;
      referencedStratum: number;
      chain: string[];
      message: string;
    };

export class CalcProfileCompileError extends Error {
  readonly issues: CompileCalcProfileError[];

  constructor(issues: CompileCalcProfileError[]) {
    super(formatCompileIssues(issues));
    this.name = "CalcProfileCompileError";
    this.issues = issues;
  }
}

export function formatCompileIssues(issues: CompileCalcProfileError[]): string {
  return issues.map((i) => i.message).join("\n");
}

export function explainCompiledSlot(
  profile: CompiledProfile,
  scope: string,
): string | undefined {
  const slot = profile.slots[scope];
  if (!slot) return undefined;

  const lines: string[] = [
    `Scope: ${scope}`,
    `Entity: ${slot.entityScope}`,
    `Property: ${slot.propertyName}`,
    `Stratum: ${slot.stratum}`,
    `Cost: ${slot.cost}`,
    `Eval: ${slot.eval ?? "auto"}`,
  ];

  if (slot.formula) lines.push(`Formula: ${slot.formula}`);
  if (slot.aggregate) {
    lines.push(
      `Aggregate: ${slot.aggregate.type} over ${slot.aggregate.over}${slot.aggregate.field ? `.${slot.aggregate.field}` : ""}`,
    );
  }
  if (slot.bindings && Object.keys(slot.bindings).length > 0) {
    lines.push(`Bindings: ${JSON.stringify(slot.bindings)}`);
  }
  if (slot.dependents.length > 0) {
    lines.push(`Dependents: ${slot.dependents.join(", ")}`);
  }

  const upstream = Object.entries(profile.slots)
    .filter(([, s]) => s.stratum < slot.stratum)
    .sort((a, b) => a[1].stratum - b[1].stratum || a[0].localeCompare(b[0]))
    .map(([s, sSlot]) => `  S${sSlot.stratum} ${s}`);

  if (upstream.length > 0) {
    lines.push("Strata chain (upstream):");
    lines.push(...upstream);
  }

  return lines.join("\n");
}
