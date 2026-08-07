import type { JSONSchema7 } from "json-schema";
import type {
  IncludeTree,
  TypedGraphTraversalFilterOptions,
} from "@graviola/typed-query-types";
import { selectionDepth } from "@graviola/typed-query-types";
import {
  definitionNameFromRef,
  definitionScope,
} from "@graviola/json-schema-utils";
import type { CompiledProfile, CompiledSlot } from "./types";
import { entityTypeNameFromScope, resolveEntitySchema } from "./bindings";

export type UnreachableSlot = {
  scope: string;
  reason: string;
};

export type CalcReadPlan = {
  /** Selection set accepted by `buildTraversalSchema` / Prisma `filterMany`. */
  selection: TypedGraphTraversalFilterOptions;
  /** Plan-derived depth (entity hops); feeds Stage 0 recursion honouring. */
  depth: number;
  /** Slots whose sources are reachable from `rootTypeName`. */
  satisfiedSlots: string[];
  /** Slots that cannot be satisfied by any schema path from the root. */
  unreachable: UnreachableSlot[];
};

function relatedTypeName(
  domainSchema: JSONSchema7,
  entityScope: string,
  propertyName: string,
): string | undefined {
  const entitySchema = resolveEntitySchema(domainSchema, entityScope);
  const prop = entitySchema?.properties?.[propertyName];
  if (!prop || typeof prop !== "object") return undefined;
  if ("$ref" in prop && typeof prop.$ref === "string") {
    return definitionNameFromRef(prop.$ref);
  }
  if (prop.type === "array") {
    const items = Array.isArray(prop.items) ? prop.items[0] : prop.items;
    if (items && typeof items === "object" && "$ref" in items) {
      return definitionNameFromRef(String(items.$ref));
    }
  }
  return undefined;
}

function isRelationProperty(
  domainSchema: JSONSchema7,
  entityScope: string,
  propertyName: string,
): boolean {
  return Boolean(relatedTypeName(domainSchema, entityScope, propertyName));
}

/**
 * BFS from `fromType` to `toType` along `$ref` / array-`$ref` edges.
 * Returns a dot path of property names, or undefined if unreachable.
 * Terminates on cycles (visited set) — same boundary as `dereferenceSchema`.
 */
function findPathToEntityType(
  domainSchema: JSONSchema7,
  fromType: string,
  toType: string,
  visited = new Set<string>(),
): string | undefined {
  if (fromType === toType) return "";
  if (visited.has(fromType)) return undefined;
  visited.add(fromType);

  const entityScope = definitionScope(fromType, domainSchema);
  const entitySchema = resolveEntitySchema(domainSchema, entityScope);
  if (!entitySchema?.properties) return undefined;

  for (const key of Object.keys(entitySchema.properties)) {
    const nextType = relatedTypeName(domainSchema, entityScope, key);
    if (!nextType) continue;
    const rest = findPathToEntityType(
      domainSchema,
      nextType,
      toType,
      new Set(visited),
    );
    if (rest === undefined) continue;
    return rest === "" ? key : `${key}.${rest}`;
  }
  return undefined;
}

function relativizeToRoot(
  domainSchema: JSONSchema7,
  rootTypeName: string,
  slot: CompiledSlot,
  sourcePath: string,
): { path: string; reason?: string } {
  const slotType = entityTypeNameFromScope(slot.entityScope);
  if (!slotType) {
    return {
      path: "",
      reason: `Cannot parse entity type from ${slot.entityScope}`,
    };
  }

  if (slotType === rootTypeName) {
    return { path: sourcePath };
  }

  const bridge = findPathToEntityType(domainSchema, rootTypeName, slotType);
  if (bridge === undefined) {
    return {
      path: "",
      reason: `No schema path from ${rootTypeName} to ${slotType}`,
    };
  }

  if (!sourcePath) return { path: bridge };
  return { path: bridge ? `${bridge}.${sourcePath}` : sourcePath };
}

type MutableInclude = {
  include?: Record<string, true | MutableInclude>;
  select?: Record<string, boolean>;
};

function ensureIncludeNode(
  parent: Record<string, true | MutableInclude>,
  key: string,
): MutableInclude {
  const existing = parent[key];
  if (existing === true || existing === undefined) {
    const node: MutableInclude = { include: {}, select: {} };
    parent[key] = node;
    return node;
  }
  existing.include = existing.include ?? {};
  existing.select = existing.select ?? {};
  return existing;
}

/**
 * Record that `rootPath` (dot path from root) must be loaded.
 * Relation prefixes become `include`; terminal scalars become `select`.
 */
function addPathNeed(
  domainSchema: JSONSchema7,
  rootTypeName: string,
  rootPath: string,
  includeRoot: Record<string, true | MutableInclude>,
  selectRoot: Record<string, boolean>,
): void {
  const segments = rootPath.split(".").filter(Boolean);
  if (segments.length === 0) return;

  let entityScope = definitionScope(rootTypeName, domainSchema);
  let includeCursor: Record<string, true | MutableInclude> | null = includeRoot;
  let selectCursor: Record<string, boolean> | null = selectRoot;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const isLast = i === segments.length - 1;
    const rel = isRelationProperty(domainSchema, entityScope, segment);

    if (isLast) {
      if (rel) {
        if (includeCursor && !includeCursor[segment]) {
          includeCursor[segment] = true;
        }
      } else if (selectCursor) {
        selectCursor[segment] = true;
      }
      return;
    }

    if (!rel || !includeCursor) return;

    const node = ensureIncludeNode(includeCursor, segment);
    includeCursor = node.include!;
    selectCursor = node.select!;

    const next = relatedTypeName(domainSchema, entityScope, segment);
    if (!next) return;
    entityScope = definitionScope(next, domainSchema);
  }
}

function pruneInclude(
  node: Record<string, true | MutableInclude>,
): Record<string, IncludeTree> {
  const out: Record<string, IncludeTree> = {};
  for (const [key, value] of Object.entries(node)) {
    if (value === true) {
      out[key] = true;
      continue;
    }
    const nestedInclude = value.include ? pruneInclude(value.include) : {};
    const nestedSelect = value.select ?? {};
    const hasInclude = Object.keys(nestedInclude).length > 0;
    const hasSelect = Object.keys(nestedSelect).length > 0;
    if (!hasInclude && !hasSelect) {
      out[key] = true;
      continue;
    }
    const cleaned: MutableInclude = {};
    if (hasInclude)
      cleaned.include = nestedInclude as Record<string, true | MutableInclude>;
    if (hasSelect) cleaned.select = nestedSelect;
    out[key] = cleaned as IncludeTree;
  }
  return out;
}

/**
 * Derive a precise read plan (selection set) from a compiled calc profile.
 *
 * Pure — no store access. Depth is derived from the include tree so Stage 0
 * CONSTRUCT generation can honour it without inventing `maxRecursion: 4`.
 */
export function planCalcReads(
  profile: CompiledProfile,
  rootTypeName: string,
  domainSchema: JSONSchema7,
): CalcReadPlan {
  const rootScope = definitionScope(rootTypeName, domainSchema);
  if (!resolveEntitySchema(domainSchema, rootScope)) {
    return {
      selection: {},
      depth: 0,
      satisfiedSlots: [],
      unreachable: [
        {
          scope: rootScope,
          reason: `Root type ${rootTypeName} not found in schema`,
        },
      ],
    };
  }

  const includeRoot: Record<string, true | MutableInclude> = {};
  const selectRoot: Record<string, boolean> = {};
  const satisfiedSlots: string[] = [];
  const unreachable: UnreachableSlot[] = [];
  const visitedEntityPaths = new Set<string>();

  const ordered = Object.entries(profile.slots).sort(
    (a, b) => a[1].stratum - b[1].stratum || a[0].localeCompare(b[0]),
  );

  for (const [scope, slot] of ordered) {
    const cycleKey = `${slot.entityScope}|${findPathToEntityType(domainSchema, rootTypeName, entityTypeNameFromScope(slot.entityScope) ?? "") ?? ""}`;
    if (visitedEntityPaths.has(cycleKey) && cycleKey.endsWith("|")) {
      // root self — fine
    }

    const sourcePaths =
      slot.sources.length > 0
        ? slot.sources
        : slot.aggregate
          ? [
              slot.aggregate.over,
              ...(slot.aggregate.field
                ? [`${slot.aggregate.over}.${slot.aggregate.field}`]
                : []),
            ]
          : [];

    if (sourcePaths.length === 0) {
      // Constant / context-only slot — no document paths to fetch.
      satisfiedSlots.push(scope);
      continue;
    }

    let failed: UnreachableSlot | undefined;
    for (const sourcePath of sourcePaths) {
      const { path: rootPath, reason } = relativizeToRoot(
        domainSchema,
        rootTypeName,
        slot,
        sourcePath,
      );
      if (reason || !rootPath) {
        failed = {
          scope,
          reason: reason ?? `Cannot resolve source "${sourcePath}"`,
        };
        break;
      }
      addPathNeed(
        domainSchema,
        rootTypeName,
        rootPath,
        includeRoot,
        selectRoot,
      );
    }

    if (failed) {
      unreachable.push(failed);
    } else {
      satisfiedSlots.push(scope);
    }
  }

  const selection: TypedGraphTraversalFilterOptions = {
    includeRelationsByDefault: false,
  };
  if (Object.keys(selectRoot).length > 0) selection.select = selectRoot;
  const cleanedInclude = pruneInclude(includeRoot);
  if (Object.keys(cleanedInclude).length > 0) {
    selection.include =
      cleanedInclude as TypedGraphTraversalFilterOptions["include"];
  }

  return {
    selection,
    depth: selectionDepth(selection.include as Record<string, IncludeTree>),
    satisfiedSlots,
    unreachable,
  };
}
