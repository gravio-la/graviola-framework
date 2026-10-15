import type {
  DerivedDefaultSpec,
  DerivedDefaultsConfig,
  PrimaryFieldDeclaration,
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

const FALLBACK_LABEL_KEYS = ["name", "title", "label", "prefLabel"] as const;

function labelKeyForTypeName(
  typeName: string | undefined,
  primaryFields: PrimaryFieldDeclaration | undefined,
): string | undefined {
  if (!typeName || !primaryFields) {
    return undefined;
  }
  const decl = primaryFields[typeName]?.label;
  return typeof decl === "string" && decl.length > 0 ? decl : undefined;
}

function pickLabelFromRecord(
  record: Record<string, unknown>,
  preferredKey: string | undefined,
): { key: string; value: string } | undefined {
  if (preferredKey) {
    const preferred = record[preferredKey];
    if (typeof preferred === "string" && preferred.length > 0) {
      return { key: preferredKey, value: preferred };
    }
  }
  for (const key of FALLBACK_LABEL_KEYS) {
    const fieldValue = record[key];
    if (typeof fieldValue === "string" && fieldValue.length > 0) {
      return { key, value: fieldValue };
    }
  }
  return undefined;
}

export function normalizeDerivedDefaultWriteValue(
  value: unknown,
  options?: {
    rootSchema?: JSONSchema7;
    valueSchema?: JSONSchema7 | undefined;
    typeName?: string | undefined;
    primaryFields?: PrimaryFieldDeclaration;
  },
): unknown {
  if (!isReferenceValue(value)) {
    return value;
  }
  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = { "@id": value["@id"] };

  const schemaType =
    options?.rootSchema && options?.valueSchema
      ? typeConstFromObjectSchema(
          resolveSchemaRef(options.rootSchema, options.valueSchema),
        )
      : undefined;
  if (typeof record["@type"] === "string") {
    result["@type"] = record["@type"];
  } else if (schemaType) {
    result["@type"] = schemaType;
  }

  const preferredLabelKey = labelKeyForTypeName(
    options?.typeName,
    options?.primaryFields,
  );
  const picked = pickLabelFromRecord(record, preferredLabelKey);
  if (picked) {
    result[picked.key] = picked.value;
  }

  return result;
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
  primaryFields?: PrimaryFieldDeclaration;
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
    primaryFields,
  } = options;

  const ownerResolved = resolveSchemaRef(rootSchema, ownerSchema);
  let currentSchema = propertySchema(rootSchema, ownerResolved, sourceSegment);
  let current: unknown = firstValue;

  const loadReferenceDocument = async (
    value: { "@id": string },
    valueSchema: JSONSchema7 | undefined,
  ): Promise<Record<string, unknown> | undefined> => {
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

  const maybeLoad = async (
    value: unknown,
    valueSchema: JSONSchema7 | undefined,
    upcomingSegment: string | undefined,
    skipLoadWhenReferenceTarget: boolean,
  ): Promise<unknown> => {
    if (!isReferenceValue(value)) {
      return value;
    }
    if (skipLoadWhenReferenceTarget) {
      return value;
    }
    if (
      upcomingSegment !== undefined &&
      readChild(value, upcomingSegment) !== undefined
    ) {
      return value;
    }
    if (upcomingSegment === undefined) {
      return value;
    }
    const doc = await loadReferenceDocument(value, valueSchema);
    return doc ?? undefined;
  };

  current = await maybeLoad(
    current,
    currentSchema,
    restPath[0],
    restPath.length === 0,
  );
  if (current === undefined) {
    return undefined;
  }

  for (let index = 0; index < restPath.length; index++) {
    const seg = restPath[index]!;
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = readChild(current, seg);
    if (current === undefined) {
      return undefined;
    }
    currentSchema = propertySchema(rootSchema, currentSchema, seg);
    const upcoming = restPath[index + 1];
    current = await maybeLoad(current, currentSchema, upcoming, false);
    if (current === undefined) {
      return undefined;
    }
  }

  if (current === undefined) {
    return undefined;
  }

  if (isReferenceValue(current)) {
    const writeTypeNameForLabel = classNameFromObjectSchema(
      rootSchema,
      resolveSchemaRef(rootSchema, currentSchema),
      typeIRIToTypeName,
    );
    const preferredLabelKey = labelKeyForTypeName(
      writeTypeNameForLabel,
      primaryFields,
    );
    if (
      !pickLabelFromRecord(
        current as Record<string, unknown>,
        preferredLabelKey,
      )
    ) {
      const loaded = await loadReferenceDocument(current, currentSchema);
      if (loaded) {
        current = { ...loaded, "@id": current["@id"] };
      }
    }
  }

  const writeTypeName = classNameFromObjectSchema(
    rootSchema,
    resolveSchemaRef(rootSchema, currentSchema),
    typeIRIToTypeName,
  );

  return normalizeDerivedDefaultWriteValue(current, {
    rootSchema,
    valueSchema: currentSchema,
    typeName: writeTypeName,
    primaryFields,
  });
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
