import type { JSONSchema7 } from "json-schema";
import { getSubschemaByPath, isJSONSchema } from "@graviola/json-schema-utils";
import type { CalcProfileSlot } from "./types";

const FORMULA_FUNCTIONS = new Set([
  "CONCAT",
  "TEXT",
  "SUM",
  "COUNT",
  "AVG",
  "MIN",
  "MAX",
  "IF",
  "AND",
  "OR",
  "NOT",
  "EQ",
  "NE",
  "GT",
  "GTE",
  "LT",
  "LTE",
  "ROUND",
  "ABS",
  "TRUE",
  "FALSE",
]);

/** Extract binding path segments from a formula string (Level 0 + 1). */
export function extractFormulaIdentifiers(formula: string): string[] {
  const tokens = formula.match(/[A-Za-z_][A-Za-z0-9_.]*/g) ?? [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const token of tokens) {
    const root = token.split(".")[0]!;
    if (FORMULA_FUNCTIONS.has(root.toUpperCase())) continue;
    if (!seen.has(token)) {
      seen.add(token);
      ids.push(token);
    }
  }
  return ids;
}

export function scopeToPropertyName(scope: string): string {
  const parts = scope.split("/");
  return parts[parts.length - 1] ?? scope;
}

export function scopeToEntityScope(scope: string): string {
  const marker = "/properties/";
  const idx = scope.lastIndexOf(marker);
  if (idx === -1) return scope;
  return scope.slice(0, idx);
}

export function entityTypeNameFromScope(
  entityScope: string,
): string | undefined {
  const match = entityScope.match(/\/definitions\/([^/]+)$/);
  return match?.[1];
}

export function resolveEntitySchema(
  domainSchema: JSONSchema7,
  entityScope: string,
): JSONSchema7 | undefined {
  const pointer = entityScope.startsWith("#")
    ? entityScope.slice(1)
    : entityScope;
  const segments = pointer.split("/").filter(Boolean);
  let current: unknown = domainSchema;
  for (const segment of segments) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return isJSONSchema(current) ? current : undefined;
}

export function validateBindingPath(
  domainSchema: JSONSchema7,
  entityScope: string,
  path: string,
): string | undefined {
  const entitySchema = resolveEntitySchema(domainSchema, entityScope);
  if (!entitySchema) {
    return `Entity scope ${entityScope} not found in schema`;
  }
  const sub = getSubschemaByPath(entitySchema, path);
  if (!sub) {
    return `Binding path "${path}" not found on entity ${entityScope}`;
  }
  return undefined;
}

export function slotDependencyPaths(
  scope: string,
  slot: CalcProfileSlot,
  domainSchema: JSONSchema7,
): { paths: string[]; computedScopes: string[]; errors: string[] } {
  const entityScope = scopeToEntityScope(scope);
  const paths: string[] = [];
  const computedScopes: string[] = [];
  const errors: string[] = [];

  if (slot.formula) {
    const identifiers = extractFormulaIdentifiers(slot.formula);
    for (const id of identifiers) {
      if (slot.bindings?.[id]) {
        const binding = slot.bindings[id];
        if (binding.path) {
          const err = validateBindingPath(
            domainSchema,
            entityScope,
            binding.path,
          );
          if (err) errors.push(err);
          paths.push(binding.path);
        }
        continue;
      }
      const err = validateBindingPath(domainSchema, entityScope, id);
      if (err) errors.push(err);
      paths.push(id);
    }
  }

  if (slot.aggregate) {
    const err = validateBindingPath(
      domainSchema,
      entityScope,
      slot.aggregate.over,
    );
    if (err) errors.push(err);
    paths.push(slot.aggregate.over);
    if (slot.aggregate.field) {
      const fieldPath = `${slot.aggregate.over}.${slot.aggregate.field}`;
      paths.push(fieldPath);
    }
  }

  return { paths, computedScopes, errors };
}

export function pathToComputedScope(
  domainSchema: JSONSchema7,
  sourceScope: string,
  path: string,
): string | undefined {
  const entityScope = scopeToEntityScope(sourceScope);
  const entitySchema = resolveEntitySchema(domainSchema, entityScope);
  if (!entitySchema) return undefined;

  const segments = path.split(".");
  let currentSchema: JSONSchema7 | undefined = entitySchema;
  let currentEntityScope = entityScope;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const isLast = i === segments.length - 1;

    if (!currentSchema) return undefined;

    if (currentSchema.type === "array" && currentSchema.items) {
      const items = Array.isArray(currentSchema.items)
        ? currentSchema.items[0]
        : currentSchema.items;
      if (isJSONSchema(items)) currentSchema = items;
    }

    const prop = currentSchema.properties?.[segment];
    if (!prop) return undefined;

    if (isLast) {
      return `${currentEntityScope}/properties/${segment}`;
    }

    if (isJSONSchema(prop)) {
      if (prop.$ref) {
        const refName = prop.$ref.split("/").pop();
        if (refName) {
          currentEntityScope = `#/definitions/${refName}`;
          currentSchema = resolveEntitySchema(domainSchema, currentEntityScope);
          continue;
        }
      }
      if (prop.type === "object" || prop.properties) {
        currentSchema = prop;
        continue;
      }
      if (prop.type === "array" && prop.items) {
        currentSchema = isJSONSchema(
          Array.isArray(prop.items) ? prop.items[0] : prop.items,
        )
          ? ((Array.isArray(prop.items)
              ? prop.items[0]
              : prop.items) as JSONSchema7)
          : undefined;
        continue;
      }
    }
    return undefined;
  }
  return undefined;
}

export function resolveArrayItemEntityScope(
  domainSchema: JSONSchema7,
  entityScope: string,
  arrayProperty: string,
): string | undefined {
  const entitySchema = resolveEntitySchema(domainSchema, entityScope);
  if (!entitySchema?.properties?.[arrayProperty]) return undefined;
  const prop = entitySchema.properties[arrayProperty];
  if (!isJSONSchema(prop)) return undefined;
  const items = Array.isArray(prop.items) ? prop.items[0] : prop.items;
  if (!isJSONSchema(items)) return undefined;
  if (items.$ref) {
    const refName = items.$ref.split("/").pop();
    return refName ? `#/definitions/${refName}` : undefined;
  }
  return undefined;
}

export function aggregateFieldComputedScope(
  domainSchema: JSONSchema7,
  entityScope: string,
  aggregate: { over: string; field?: string },
): string | undefined {
  if (!aggregate.field) return undefined;
  const itemEntityScope = resolveArrayItemEntityScope(
    domainSchema,
    entityScope,
    aggregate.over,
  );
  if (!itemEntityScope) return undefined;
  return `${itemEntityScope}/properties/${aggregate.field}`;
}

export function inferCost(
  slot: CalcProfileSlot,
): "static" | "low" | "medium" | "high" {
  if (slot.aggregate) return "medium";
  if (slot.formula && /SUM|AVG|COUNT/i.test(slot.formula)) return "medium";
  return "low";
}
