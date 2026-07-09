import { HyperFormula } from "hyperformula";
import type {
  CompiledProfile,
  CompiledSlot,
} from "@graviola/formula-dependency";

export type FormulaEvaluationContext = {
  /** Optional resolver for `context:` bindings (not used in garden-fee v1). */
  contextValues?: Record<string, unknown>;
};

export type FormulaEvaluationResult = {
  data: Record<string, unknown>;
  computed: Record<string, unknown>;
};

/** Narrow adapter over HyperFormula — swap engine without leaking types upstream. */
export class HyperFormulaAdapter {
  private readonly engine: HyperFormula;

  constructor() {
    this.engine = HyperFormula.buildFromArray([[null]], {
      licenseKey: "gpl-v3",
      useColumnIndex: false,
    });
  }

  evaluateExpression(
    formula: string,
    variables: Record<string, number | string | boolean>,
  ): unknown {
    const sheetId = this.engine.getSheetId(this.engine.getSheetNames()[0]!);
    if (sheetId === undefined) {
      throw new Error("HyperFormulaAdapter: no sheet available");
    }
    for (const [name, value] of Object.entries(variables)) {
      this.engine.addNamedExpression(name, value, sheetId);
    }
    const result = this.engine.calculateFormula(`=${formula}`, sheetId);
    for (const name of Object.keys(variables)) {
      this.engine.removeNamedExpression(name, sheetId);
    }
    return result;
  }

  destroy(): void {
    this.engine.destroy();
  }
}

function getAtPath(obj: unknown, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = obj;
  for (const segment of segments) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function numeric(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  return 0;
}

function evaluateAggregate(
  slot: CompiledSlot,
  entity: Record<string, unknown>,
): number {
  const agg = slot.aggregate!;
  const collection = getAtPath(entity, agg.over);
  if (!Array.isArray(collection)) return 0;

  const values = collection.map((item) => {
    if (!agg.field) return 1;
    return numeric(getAtPath(item, agg.field));
  });

  switch (agg.type) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "count":
      return values.length;
    case "avg":
      return values.length === 0
        ? 0
        : values.reduce((a, b) => a + b, 0) / values.length;
    default:
      return 0;
  }
}

function buildFormulaVariables(
  entity: Record<string, unknown>,
  slot: CompiledSlot,
): { variables: Record<string, number | string | boolean>; formula: string } {
  const vars: Record<string, number | string | boolean> = {};
  if (!slot.formula) return { variables: vars, formula: "" };

  let formula = slot.formula;
  const identifiers = slot.formula.match(/[A-Za-z_][A-Za-z0-9_.]*/g) ?? [];
  const seen = new Set<string>();

  for (const id of identifiers) {
    if (seen.has(id)) continue;
    seen.add(id);

    const alias = id.replace(/\./g, "_");
    if (alias !== id) {
      formula = formula.replaceAll(id, alias);
    }

    if (slot.bindings?.[id]?.path) {
      const value = getAtPath(entity, slot.bindings[id].path!);
      vars[alias] =
        typeof value === "boolean" || typeof value === "string"
          ? value
          : numeric(value);
      continue;
    }

    const value = getAtPath(entity, id);
    if (value !== undefined) {
      vars[alias] =
        typeof value === "boolean" || typeof value === "string"
          ? value
          : numeric(value);
    }
  }

  return { variables: vars, formula };
}

function slotsByStratum(profile: CompiledProfile): CompiledSlot[] {
  return Object.entries(profile.slots)
    .sort((a, b) => a[1].stratum - b[1].stratum)
    .map(([, slot]) => slot);
}

function entityTypeFromData(data: Record<string, unknown>): string | undefined {
  const type = data["@type"];
  if (typeof type === "string") {
    const parts = type.split("/");
    return parts[parts.length - 1];
  }
  return undefined;
}

function applySlotToEntityTree(
  root: Record<string, unknown>,
  slot: CompiledSlot,
  adapter: HyperFormulaAdapter,
): void {
  const typeName = slot.entityScope.match(/\/definitions\/([^/]+)$/)?.[1];
  if (!typeName) return;

  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }

    const record = node as Record<string, unknown>;
    const nodeType =
      entityTypeFromData(record) ?? inferTypeFromStructure(record);

    if (nodeType === typeName) {
      let value: unknown;
      if (slot.aggregate) {
        value = evaluateAggregate(slot, record);
      } else if (slot.formula) {
        const { variables, formula } = buildFormulaVariables(record, slot);
        value = adapter.evaluateExpression(formula, variables);
      }
      record[slot.propertyName] = value;
    }

    for (const val of Object.values(record)) {
      if (val && typeof val === "object") visit(val);
    }
  };

  visit(root);
}

function inferTypeFromStructure(
  record: Record<string, unknown>,
): string | undefined {
  if ("plots" in record) return "Patch";
  if ("width_m" in record && "length_m" in record) return "Plot";
  if ("patch" in record && "fee_rate_per_sqm" in record) return "Garden";
  return undefined;
}

function cloneData<T>(value: T): T {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export function evaluateCompiledProfile(
  profile: CompiledProfile,
  data: Record<string, unknown>,
  _context?: FormulaEvaluationContext,
): FormulaEvaluationResult {
  const result = cloneData(data) as Record<string, unknown>;
  const adapter = new HyperFormulaAdapter();
  const computed: Record<string, unknown> = {};

  try {
    for (const slot of slotsByStratum(profile)) {
      applySlotToEntityTree(result, slot, adapter);
      const scope = Object.entries(profile.slots).find(
        ([, s]) => s === slot,
      )?.[0];
      if (scope) {
        const typeName = slot.entityScope.match(/\/definitions\/([^/]+)$/)?.[1];
        if (typeName === "Garden" || !typeName) {
          computed[slot.propertyName] = result[slot.propertyName];
        }
      }
    }
  } finally {
    adapter.destroy();
  }

  return { data: result, computed };
}

export function evaluateCompiledProfileDeterministic(
  profile: CompiledProfile,
  data: Record<string, unknown>,
  context?: FormulaEvaluationContext,
): Record<string, unknown> {
  return evaluateCompiledProfile(profile, data, context).data;
}
