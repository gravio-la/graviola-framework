import type { JSONSchema7 } from "json-schema";

import { resolveSchema, type JsonSchema } from "./resolver";

/** Decode one JSON Pointer segment */
function decodeSeg(pointerSegment: string): string {
  return pointerSegment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function encodeSeg(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

function normalizeScope(scope: string | undefined): string {
  if (scope == null || scope === "" || scope === "#") return "#";
  return scope.startsWith("#") ? scope : `#/${scope}`;
}

function schemaDeclaresArrayType(schema: JSONSchema7 | undefined): boolean {
  const t = schema?.type;
  return (
    t === "array" || (Array.isArray(t) && (t as string[]).includes("array"))
  );
}

function expandArrayItemsRef(
  schema: JSONSchema7,
  rootSchema: JSONSchema7,
): JSONSchema7 {
  if (!schemaDeclaresArrayType(schema) || schema.items == null) return schema;
  if (Array.isArray(schema.items)) return schema;

  const itemsSchema = schema.items as JSONSchema7;
  if (typeof itemsSchema === "boolean") return schema;
  if (!itemsSchema.$ref) return schema;

  const resolvedItems = resolvePropertySchemaInRoot(itemsSchema, rootSchema);
  return { ...schema, items: resolvedItems };
}

function resolvePropertySchemaInRoot(
  propSchema: JSONSchema7,
  rootSchema: JSONSchema7,
): JSONSchema7 {
  let resolved: JSONSchema7;
  if (propSchema.$ref) {
    const r = resolveSchema(rootSchema, propSchema.$ref, rootSchema) as
      | JSONSchema7
      | undefined;
    resolved = r ?? propSchema;
  } else {
    resolved = propSchema;
  }
  return expandArrayItemsRef(resolved, rootSchema);
}

function mergeDefsIntoLocalRoot(
  itemSchema: JSONSchema7,
  fullRoot: JSONSchema7,
): JSONSchema7 {
  const definitions = fullRoot.definitions;
  const defs = (fullRoot as { $defs?: JSONSchema7["definitions"] }).$defs;
  if (
    (!definitions || typeof definitions !== "object") &&
    (!defs || typeof defs !== "object")
  ) {
    return itemSchema;
  }
  return {
    ...itemSchema,
    ...(definitions ? { definitions } : {}),
    ...(defs ? { $defs: defs } : {}),
  };
}

export interface SchemaScopeFrame {
  /** Original document — needed for $ref resolution. Never changes during a walk. */
  rootSchema: JSONSchema7;
  /** Local root for relative scope pointers — resets at each array/detail boundary. */
  localRootSchema: JSONSchema7;
  /** JSON Pointer within localRootSchema; "" / "#" = the local root itself. */
  scope: string;
  /** Absolute instance-data path from the dispatch root. */
  dataPath: (string | number)[];
  /** Stack of parent frames (debugging, error messages, motion-id derivation). */
  parent?: SchemaScopeFrame;
}

export function rootFrame(schema: JSONSchema7): SchemaScopeFrame {
  let localRootSchema = schema;
  if (schema.$ref) {
    const resolved = resolveSchema(schema, schema.$ref, schema) as
      | JSONSchema7
      | undefined;
    if (resolved) localRootSchema = resolved;
  }
  return {
    rootSchema: schema,
    localRootSchema,
    scope: "#",
    dataPath: [],
  };
}

/**
 * Resolve a relative scope pointer against the current frame; expands $ref + array items.
 */
export function resolveInFrame(
  frame: SchemaScopeFrame,
  relativeScope: string,
): { schema: JSONSchema7; scope: string } | undefined {
  const scope = normalizeScope(relativeScope);
  const resolved = resolveSchema(
    frame.localRootSchema,
    scope,
    frame.rootSchema,
  ) as JSONSchema7 | undefined;
  if (!resolved) return undefined;
  const expanded = resolvePropertySchemaInRoot(resolved, frame.rootSchema);
  return { schema: expanded, scope };
}

/** Descend into a property: extends scope and dataPath; localRootSchema unchanged. */
export function enterPropertyFrame(
  frame: SchemaScopeFrame,
  propertyKey: string,
): SchemaScopeFrame {
  const enc = encodeSeg(propertyKey);
  const base =
    frame.scope === "#" ? "#/properties" : `${frame.scope}/properties`;
  return {
    ...frame,
    scope: `${base}/${enc}`,
    dataPath: [...frame.dataPath, propertyKey],
    parent: frame,
  };
}

/**
 * Descend into one item of an array control at `arrayScope`.
 * Resets localRootSchema to the array's items schema; scope to "#".
 */
export function enterArrayDetailFrame(
  frame: SchemaScopeFrame,
  arrayScope: string,
  itemIndex: number,
): SchemaScopeFrame | undefined {
  const arrayResolved = resolveInFrame(frame, arrayScope);
  if (!arrayResolved) return undefined;

  const arrSchema = arrayResolved.schema;
  if (!schemaDeclaresArrayType(arrSchema)) return undefined;

  const rawItems = arrSchema.items;
  if (!rawItems || typeof rawItems === "boolean") return undefined;
  const itemSchema = rawItems as JSONSchema7;

  const localRoot = mergeDefsIntoLocalRoot(
    resolvePropertySchemaInRoot(itemSchema, frame.rootSchema),
    frame.rootSchema,
  );

  const pathFromScope = scopeToDataPathSegments(arrayScope);
  const propertyKey = pathFromScope[pathFromScope.length - 1];
  if (propertyKey == null) return undefined;

  return {
    rootSchema: frame.rootSchema,
    localRootSchema: localRoot,
    scope: "#",
    dataPath: [...frame.dataPath, propertyKey, itemIndex],
    parent: frame,
  };
}

/** Walk instance data within a frame — replaces ad-hoc single-root dataAtScope. */
export function dataInFrame(
  frame: SchemaScopeFrame,
  rootData: unknown,
): unknown {
  let cur: unknown = rootData;
  for (const seg of frame.dataPath) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg as string];
  }
  return cur;
}

/** Dot-path segments from a scope pointer (properties only). */
export function scopeToDataPathSegments(scope: string | undefined): string[] {
  if (!scope || scope === "#") return [];
  const trimmed = scope.startsWith("#") ? scope.slice(1) : scope;
  const segments = trimmed.split("/").filter(Boolean).map(decodeSeg);
  const path: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === "properties" && segments[i + 1] !== undefined) {
      path.push(segments[i + 1]);
      i++;
    }
  }
  return path;
}

/** @deprecated Use {@link dataInFrame} with a {@link SchemaScopeFrame}. */
export function dataAtScopeFromFrame(
  frame: SchemaScopeFrame,
  rootData: unknown,
): unknown {
  return dataInFrame(frame, rootData);
}
