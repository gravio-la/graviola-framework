import { HyperFormula } from "hyperformula";
import type {
  CompiledProfile,
  CompiledSlot,
} from "@graviola/formula-dependency";
import { definitionNameFromScope } from "@graviola/json-schema-utils";
import cloneDeep from "lodash-es/cloneDeep";
import get from "lodash-es/get";

export type FormulaEvaluationContext = {
  /** Optional resolver for `context:` bindings. */
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
  const collection = get(entity, agg.over);
  if (!Array.isArray(collection)) return 0;

  const values = collection.map((item) => {
    if (!agg.field) return 1;
    return numeric(get(item, agg.field));
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
      const value = get(entity, slot.bindings[id].path!);
      vars[alias] =
        typeof value === "boolean" || typeof value === "string"
          ? value
          : numeric(value);
      continue;
    }

    const value = get(entity, id);
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

/**
 * Local type name from `@type` (IRI fragment, last path segment, or bare name).
 * Named entities in the eval tree must carry `@type` — no structural guessing.
 */
export function entityTypeFromData(
  data: Record<string, unknown>,
): string | undefined {
  const type = data["@type"];
  if (typeof type !== "string" || type.length === 0) return undefined;
  const hash = type.lastIndexOf("#");
  if (hash >= 0) return type.slice(hash + 1) || undefined;
  const slash = type.lastIndexOf("/");
  return slash >= 0 ? type.slice(slash + 1) : type;
}

function applySlotToEntityTree(
  root: Record<string, unknown>,
  slot: CompiledSlot,
  adapter: HyperFormulaAdapter,
): void {
  const typeName = definitionNameFromScope(slot.entityScope);
  if (!typeName) return;

  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }

    const record = node as Record<string, unknown>;
    const nodeType = entityTypeFromData(record);

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

export function evaluateCompiledProfile(
  profile: CompiledProfile,
  data: Record<string, unknown>,
  _context?: FormulaEvaluationContext,
  sharedAdapter?: HyperFormulaAdapter,
): FormulaEvaluationResult {
  const result = cloneDeep(data) as Record<string, unknown>;
  const ownsAdapter = !sharedAdapter;
  const adapter = sharedAdapter ?? new HyperFormulaAdapter();
  const computed: Record<string, unknown> = {};
  const rootType = entityTypeFromData(result);

  try {
    for (const slot of slotsByStratum(profile)) {
      applySlotToEntityTree(result, slot, adapter);
      const typeName = definitionNameFromScope(slot.entityScope);
      // Surface only slots owned by the eval root (not nested entities).
      if (typeName && rootType && typeName === rootType) {
        computed[slot.propertyName] = result[slot.propertyName];
      }
    }
  } finally {
    if (ownsAdapter) adapter.destroy();
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
