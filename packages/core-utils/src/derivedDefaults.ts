import type {
  DerivedDefaultSpec,
  DerivedDefaultsConfig,
} from "@graviola/edb-core-types";
import get from "lodash-es/get";
import isEqual from "lodash-es/isEqual";
import set from "lodash-es/set";
import cloneDeep from "lodash-es/cloneDeep";
import type { JSONSchema7 } from "json-schema";

const DEF_REF = /^#\/definitions\/([^/]+)$/;

export type DerivedDefaultJob = {
  targetPath: string;
  firstValue: unknown;
  restPath: string[];
  spec: DerivedDefaultSpec;
  sourceSegment: string;
  ownerObjectSchema: JSONSchema7 | undefined;
};

export function isAbsentValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record["@id"] === "string") {
      return false;
    }
    return Object.keys(record).length === 0;
  }
  return false;
}

export function shouldApplyDerivedDefault(
  currentTargetValue: unknown,
  autoFilledValue: unknown | undefined,
): boolean {
  if (isAbsentValue(currentTargetValue)) {
    return true;
  }
  if (
    autoFilledValue !== undefined &&
    isEqual(currentTargetValue, autoFilledValue)
  ) {
    return true;
  }
  return false;
}

export function applyDerivedDefault<T extends Record<string, unknown>>(
  data: T,
  targetPath: string,
  value: unknown,
): T {
  const current = get(data, targetPath);
  if (isEqual(current, value)) {
    return data;
  }
  const next = cloneDeep(data);
  set(next, targetPath, value);
  return next;
}

export function resolveSchemaRef(
  rootSchema: JSONSchema7,
  schema: JSONSchema7 | undefined,
): JSONSchema7 | undefined {
  if (!schema) {
    return undefined;
  }
  if (schema.$ref) {
    const match = schema.$ref.match(DEF_REF);
    const defs = rootSchema.definitions ?? rootSchema.$defs;
    if (match && defs && typeof defs === "object") {
      const resolved = (defs as Record<string, JSONSchema7>)[match[1]];
      if (resolved) {
        return resolveSchemaRef(rootSchema, resolved);
      }
    }
  }
  return schema;
}

function itemsSchema(
  rootSchema: JSONSchema7,
  schema: JSONSchema7 | undefined,
): JSONSchema7 | undefined {
  const resolved = resolveSchemaRef(rootSchema, schema);
  if (!resolved?.items) {
    return undefined;
  }
  const items = resolved.items;
  if (Array.isArray(items)) {
    return resolveSchemaRef(rootSchema, items[0] as JSONSchema7);
  }
  return resolveSchemaRef(rootSchema, items as JSONSchema7);
}

function propertySchema(
  rootSchema: JSONSchema7,
  objectSchema: JSONSchema7 | undefined,
  key: string,
): JSONSchema7 | undefined {
  const resolved = resolveSchemaRef(rootSchema, objectSchema);
  const prop = resolved?.properties?.[key];
  if (!prop || typeof prop === "boolean") {
    return undefined;
  }
  return resolveSchemaRef(rootSchema, prop as JSONSchema7);
}

function typeConstFromObjectSchema(
  schema: JSONSchema7 | undefined,
): string | undefined {
  if (!schema?.properties) {
    return undefined;
  }
  const atType = schema.properties["@type"] as JSONSchema7 | undefined;
  if (!atType || typeof atType !== "object") {
    return undefined;
  }
  if (typeof atType.const === "string") {
    return atType.const;
  }
  return undefined;
}

export function classNameFromObjectSchema(
  rootSchema: JSONSchema7,
  objectSchema: JSONSchema7 | undefined,
  typeIRIToTypeName?: (typeIRI: string) => string | undefined,
): string | undefined {
  const resolved = resolveSchemaRef(rootSchema, objectSchema);
  if (!resolved) {
    return undefined;
  }
  if (resolved.$ref) {
    const match = resolved.$ref.match(DEF_REF);
    if (match) {
      return match[1];
    }
  }
  const typeIRI = typeConstFromObjectSchema(resolved);
  if (typeIRI && typeIRIToTypeName) {
    const mapped = typeIRIToTypeName(typeIRI);
    if (mapped && mapped !== typeIRI) {
      return mapped;
    }
  }
  if (typeIRI && rootSchema.definitions) {
    for (const [name, def] of Object.entries(rootSchema.definitions)) {
      if (typeConstFromObjectSchema(def as JSONSchema7) === typeIRI) {
        return name;
      }
    }
  }
  return undefined;
}

function isReferenceValue(value: unknown): value is { "@id": string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { "@id"?: unknown })["@id"] === "string"
  );
}

export function segmentValueChanged(prev: unknown, next: unknown): boolean {
  if (isReferenceValue(prev) || isReferenceValue(next)) {
    const prevId = isReferenceValue(prev) ? prev["@id"] : undefined;
    const nextId = isReferenceValue(next) ? next["@id"] : undefined;
    return prevId !== nextId;
  }
  return !isEqual(prev, next);
}

function readChild(value: unknown, key: string): unknown {
  if (value === null || value === undefined || typeof value !== "object") {
    return undefined;
  }
  if (Array.isArray(value)) {
    const index = Number(key);
    if (!Number.isInteger(index)) {
      return undefined;
    }
    return value[index];
  }
  return (value as Record<string, unknown>)[key];
}

function walkForJobs(
  rootSchema: JSONSchema7,
  prev: unknown,
  next: unknown,
  nodeSchema: JSONSchema7 | undefined,
  dotPath: string,
  config: DerivedDefaultsConfig,
  classOf: (objectSchema: JSONSchema7 | undefined) => string | undefined,
  jobs: DerivedDefaultJob[],
): void {
  if (next === null || next === undefined) {
    return;
  }

  if (Array.isArray(next)) {
    const itemSch = itemsSchema(rootSchema, nodeSchema);
    next.forEach((item, index) => {
      const childPath = dotPath ? `${dotPath}.${index}` : String(index);
      walkForJobs(
        rootSchema,
        readChild(prev, String(index)),
        item,
        itemSch,
        childPath,
        config,
        classOf,
        jobs,
      );
    });
    return;
  }

  if (typeof next !== "object") {
    return;
  }

  const objectSchema = resolveSchemaRef(rootSchema, nodeSchema);
  const className = classOf(objectSchema);
  if (className && config[className]) {
    for (const [targetSlot, spec] of Object.entries(config[className])) {
      const path = spec.path;
      if (!path?.length) {
        continue;
      }
      const seg0 = path[0];
      const prevSeg = readChild(prev, seg0);
      const nextSeg = readChild(next, seg0);
      if (segmentValueChanged(prevSeg, nextSeg)) {
        jobs.push({
          targetPath: dotPath ? `${dotPath}.${targetSlot}` : targetSlot,
          firstValue: nextSeg,
          restPath: path.slice(1),
          spec,
          sourceSegment: seg0,
          ownerObjectSchema: objectSchema,
        });
      }
    }
  }

  const props = objectSchema?.properties;
  if (!props) {
    return;
  }

  for (const key of Object.keys(next as Record<string, unknown>)) {
    if (key === "@type") {
      continue;
    }
    const childSchema = propertySchema(rootSchema, objectSchema, key);
    const childPath = dotPath ? `${dotPath}.${key}` : key;
    walkForJobs(
      rootSchema,
      readChild(prev, key),
      readChild(next, key),
      childSchema,
      childPath,
      config,
      classOf,
      jobs,
    );
  }
}

export function planDerivedDefaultJobs(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
  schema: JSONSchema7,
  config: DerivedDefaultsConfig | undefined,
  classOf: (objectSchema: JSONSchema7 | undefined) => string | undefined,
): DerivedDefaultJob[] {
  if (!config || Object.keys(config).length === 0) {
    return [];
  }
  const jobs: DerivedDefaultJob[] = [];
  walkForJobs(schema, prev, next, schema, "", config, classOf, jobs);
  return jobs;
}

export function normalizeDerivedDefaultWriteValue(value: unknown): unknown {
  if (isReferenceValue(value)) {
    return { "@id": value["@id"] };
  }
  return value;
}

export function isBareEntityReference(
  value: unknown,
): value is { "@id": string } {
  if (!isReferenceValue(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  for (const [key, fieldValue] of Object.entries(record)) {
    if (key === "@id" || key === "@type") {
      continue;
    }
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
      return false;
    }
  }
  return true;
}

export async function resolveDerivedPathValue(options: {
  rootSchema: JSONSchema7;
  ownerSchema: JSONSchema7 | undefined;
  sourceSegment: string;
  firstValue: unknown;
  restPath: string[];
  loadDocument: (
    typeName: string,
    iri: string,
  ) => Promise<Record<string, unknown> | null | undefined>;
  typeIRIToTypeName: (typeIRI: string) => string | undefined;
  cache: Map<string, Record<string, unknown>>;
}): Promise<unknown | undefined> {
  const {
    rootSchema,
    ownerSchema,
    sourceSegment,
    firstValue,
    restPath,
    loadDocument,
    typeIRIToTypeName,
    cache,
  } = options;

  const ownerResolved = resolveSchemaRef(rootSchema, ownerSchema);
  let currentSchema = propertySchema(rootSchema, ownerResolved, sourceSegment);
  let current: unknown = firstValue;

  const maybeLoad = async (
    value: unknown,
    valueSchema: JSONSchema7 | undefined,
  ): Promise<unknown> => {
    if (!isBareEntityReference(value)) {
      return value;
    }
    const resolvedSch = resolveSchemaRef(rootSchema, valueSchema);
    const typeName = classNameFromObjectSchema(
      rootSchema,
      resolvedSch,
      typeIRIToTypeName,
    );
    if (!typeName) {
      return undefined;
    }
    const iri = value["@id"];
    const cacheKey = `${typeName}:${iri}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const doc = await loadDocument(typeName, iri);
    if (!doc) {
      return undefined;
    }
    cache.set(cacheKey, doc);
    return doc;
  };

  current = await maybeLoad(current, currentSchema);
  if (current === undefined) {
    return undefined;
  }

  for (const seg of restPath) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = readChild(current, seg);
    currentSchema = propertySchema(rootSchema, currentSchema, seg);
    current = await maybeLoad(current, currentSchema);
    if (current === undefined) {
      return undefined;
    }
  }

  if (current === undefined) {
    return undefined;
  }
  return normalizeDerivedDefaultWriteValue(current);
}

/** Drop auto-fill tracking when the user edits a target path away from the auto value. */
export function pruneAutoFilledPaths(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
  autoFilled: Map<string, unknown>,
): void {
  for (const [path, autoValue] of [...autoFilled.entries()]) {
    const nextVal = get(next, path);
    const prevVal = get(prev, path);
    if (!isEqual(nextVal, prevVal) && !isEqual(nextVal, autoValue)) {
      autoFilled.delete(path);
    }
  }
}
