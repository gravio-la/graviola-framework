import type { JSONSchema7 } from "json-schema";
import {
  contentHash8,
  type EntityIdentityOptions,
  schemaHasEntityIdentity,
} from "@graviola/json-schema-utils";
import type {
  StatementNode,
  StatementValue,
  StatementWrite,
  StatementWritePolicy,
} from "@graviola/provenance-types";

export type {
  StatementNode,
  StatementValue,
  StatementWrite,
  StatementWritePolicy,
} from "@graviola/provenance-types";

export const STATEMENT_SCHEMA_IRI = "https://graviola.gra.one/statement/v1";
export const STATEMENT_DEFINITION = "StatementNode";
export const STATEMENT_JSON_SUFFIX = "$stmt";
export const STATEMENT_PERSISTENCE_SUFFIX = "__stmt";

/** Keys are `<DefinitionName>.<dot.path>`, e.g. "Item.price". */
export type StatementPolicyMap = Record<string, StatementWritePolicy>;

export type DeriveProvenanceSchemaOptions = EntityIdentityOptions & {
  policies?: StatementPolicyMap;
  inlineStatementSchema?: boolean;
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Duplicate of meta-schema flattenMetaSchemaProfile — keep packages independent. */
export function flattenStatementSchemaProfile(
  schema: JSONSchema7,
): JSONSchema7 {
  if (!schema.allOf?.length) {
    return cloneJson(schema);
  }

  const merged: JSONSchema7 = {
    ...(schema.$id ? { $id: schema.$id } : {}),
    type: "object",
    properties: {},
    additionalProperties: schema.additionalProperties ?? false,
  };

  for (const branch of schema.allOf) {
    if (!branch || typeof branch !== "object" || Array.isArray(branch))
      continue;
    const part = branch as JSONSchema7;
    if (part.properties) {
      merged.properties = {
        ...merged.properties,
        ...cloneJson(part.properties),
      };
    }
    if (part.required?.length) {
      merged.required = [...(merged.required ?? []), ...part.required];
    }
  }

  return merged;
}

const wasGeneratedBySchema: JSONSchema7 = {
  type: "object",
  description: "prov:wasGeneratedBy",
  properties: {
    formulaId: { type: "string" },
    lensId: { type: "string" },
    stratum: { type: "integer" },
    inputFingerprint: { type: "string" },
    agent: { type: "string" },
    generatedAt: { type: "string", format: "date-time" },
  },
  additionalProperties: false,
};

/**
 * Compose the framework statement profile. Identity/versioning uses
 * {@link schemaIdentityOf} from `@graviola/json-schema-utils`.
 */
export function composeStatementSchemaProfile(): JSONSchema7 {
  return {
    $id: STATEMENT_SCHEMA_IRI,
    type: "object",
    properties: {
      value: { type: ["string", "number", "boolean"] },
      rank: {
        type: "string",
        enum: ["preferred", "normal", "deprecated"],
        description: "gra:stmtRank",
      },
      source: { type: "string", description: "dct:source" },
      generatedAt: {
        type: "string",
        format: "date-time",
        description: "prov:generatedAtTime",
      },
      wasGeneratedBy: wasGeneratedBySchema,
    },
    additionalProperties: false,
  };
}

export const baseStatementSchemaProfile: JSONSchema7 =
  composeStatementSchemaProfile();

/**
 * Compose a StatementSchema profile via `allOf` (application extensions).
 * Extension fields should declare IRI mappings in their `description`.
 */
export function extendStatementSchema(
  base: JSONSchema7,
  extension: JSONSchema7,
): JSONSchema7 {
  return {
    allOf: [cloneJson(base), cloneJson(extension)],
  };
}

export function resolveStatementPolicy(
  policies: StatementPolicyMap | undefined,
  typeName: string,
  path: string,
): StatementWritePolicy {
  if (!policies) return "never";
  return policies[`${typeName}.${path}`] ?? "never";
}

function isStatementKey(key: string): boolean {
  return (
    key.endsWith(STATEMENT_JSON_SUFFIX) ||
    key.endsWith(STATEMENT_PERSISTENCE_SUFFIX)
  );
}

function shouldSkipPropertyKey(key: string): boolean {
  return (
    key.startsWith("@") ||
    key === "entityMeta" ||
    key === "$meta" ||
    isStatementKey(key)
  );
}

function graftPropertyAtPointer(
  schema: JSONSchema7,
  pointer: string,
  propName: string,
  propSchema: JSONSchema7,
): void {
  let current: Record<string, unknown> = schema as Record<string, unknown>;
  if (pointer !== "#") {
    const segments = pointer.replace(/^#\//, "").split("/").filter(Boolean);
    for (const segment of segments) {
      const next = current[segment];
      if (!next || typeof next !== "object") return;
      current = next as Record<string, unknown>;
    }
  }

  if (current.type !== "object") return;
  const properties = (current.properties ?? {}) as Record<string, JSONSchema7>;
  current.properties = {
    ...properties,
    [propName]: cloneJson(propSchema),
  };
}

function resolveInlineSchema(propSchema: JSONSchema7): JSONSchema7 | undefined {
  if (propSchema.$ref) return undefined;
  if (propSchema.type === "object" && propSchema.properties) {
    return propSchema;
  }
  if (propSchema.type === "array" && propSchema.items) {
    const items = propSchema.items;
    if (Array.isArray(items)) return undefined;
    if (
      typeof items === "object" &&
      items.type === "object" &&
      items.properties
    ) {
      return items as JSONSchema7;
    }
  }
  return undefined;
}

function graftStatementsInObjectSchema(
  schema: JSONSchema7,
  objectSchema: JSONSchema7,
  schemaPointer: string,
  typeName: string,
  dotPathPrefix: string,
  policies: StatementPolicyMap | undefined,
  statementItemSchema: JSONSchema7,
  identity?: EntityIdentityOptions,
): void {
  const properties = objectSchema.properties ?? {};
  for (const [key, rawProp] of Object.entries(properties)) {
    if (shouldSkipPropertyKey(key)) continue;
    if (!rawProp || typeof rawProp !== "object" || Array.isArray(rawProp))
      continue;
    const propSchema = rawProp as JSONSchema7;
    const dotPath = dotPathPrefix ? `${dotPathPrefix}.${key}` : key;
    const propPointer = `${schemaPointer}/properties/${key}`;

    if (resolveStatementPolicy(policies, typeName, dotPath) === "always") {
      graftPropertyAtPointer(
        schema,
        schemaPointer,
        `${key}${STATEMENT_PERSISTENCE_SUFFIX}`,
        {
          type: "array",
          items: cloneJson(statementItemSchema),
        },
      );
    }

    const inline = resolveInlineSchema(propSchema);
    if (inline && !schemaHasEntityIdentity(inline.properties, identity)) {
      graftStatementsInObjectSchema(
        schema,
        inline,
        propPointer,
        typeName,
        dotPath,
        policies,
        statementItemSchema,
        identity,
      );
    }
  }
}

export function deriveProvenanceSchema(
  domainSchema: JSONSchema7,
  statementSchema?: JSONSchema7,
  options?: DeriveProvenanceSchemaOptions,
): JSONSchema7 {
  const effectiveStatementSchema =
    statementSchema ?? composeStatementSchemaProfile();
  const extended = cloneJson(domainSchema) as JSONSchema7;
  if (!extended.definitions) {
    extended.definitions = {};
  }

  const normalizedStatement = flattenStatementSchemaProfile(
    cloneJson(effectiveStatementSchema),
  );
  const statementItemSchema: JSONSchema7 = options?.inlineStatementSchema
    ? normalizedStatement
    : (() => {
        extended.definitions![STATEMENT_DEFINITION] = normalizedStatement;
        return { $ref: `#/definitions/${STATEMENT_DEFINITION}` };
      })();

  const definitions = extended.definitions ?? {};
  for (const [defName, def] of Object.entries(definitions)) {
    if (!def || typeof def !== "object" || Array.isArray(def)) continue;
    const defSchema = def as JSONSchema7;
    if (defSchema.type !== "object" || !defSchema.properties) continue;
    graftStatementsInObjectSchema(
      extended,
      defSchema,
      `#/definitions/${defName}`,
      defName,
      "",
      options?.policies,
      statementItemSchema,
      options,
    );
  }

  if (extended.properties) {
    const rootName = extended.$id?.split("/").pop() ?? "Root";
    graftStatementsInObjectSchema(
      extended,
      extended,
      "#",
      rootName,
      "",
      options?.policies,
      statementItemSchema,
      options,
    );
  }

  return extended;
}

/** Canonical primitive for hashing and round-trip (RDF literals may arrive as strings). */
export function normalizeStatementValue(value: unknown): StatementValue {
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
    const trimmed = value.trim();
    if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
    return value;
  }
  throw new Error(
    `normalizeStatementValue: expected primitive, got ${typeof value}`,
  );
}

export function statementValueHash(value: StatementValue): string {
  return contentHash8(normalizeStatementValue(value));
}

function navigateToParent(
  obj: Record<string, unknown>,
  path: string,
): { parent: Record<string, unknown>; lastSegment: string } {
  const segments = path.split(".").filter(Boolean);
  if (segments.length === 0) {
    throw new Error("applyStatementWrites: empty path");
  }
  const lastSegment = segments.pop()!;
  let current: unknown = obj;
  for (const seg of segments) {
    if (
      current == null ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      throw new Error(
        `applyStatementWrites: path segment '${seg}' of '${path}' does not exist on the document`,
      );
    }
    const next = (current as Record<string, unknown>)[seg];
    if (next === undefined) {
      throw new Error(
        `applyStatementWrites: path segment '${seg}' of '${path}' does not exist on the document`,
      );
    }
    if (Array.isArray(next)) {
      throw new Error(
        `applyStatementWrites: intermediate array at '${seg}' in path '${path}' is not supported`,
      );
    }
    current = next;
  }
  if (
    current == null ||
    typeof current !== "object" ||
    Array.isArray(current)
  ) {
    throw new Error(
      `applyStatementWrites: path segment '${lastSegment}' of '${path}' does not exist on the document`,
    );
  }
  return { parent: current as Record<string, unknown>, lastSegment };
}

export function applyStatementWrites<T extends Record<string, unknown>>(
  document: T,
  writes: StatementWrite[],
): T {
  const copy = cloneJson(document) as T;

  for (const write of writes) {
    const { parent, lastSegment } = navigateToParent(copy, write.path);
    parent[lastSegment] = write.value;

    const stmtKey = `${lastSegment}${STATEMENT_JSON_SUFFIX}`;
    const existing = (parent[stmtKey] as StatementNode[] | undefined) ?? [];
    const hash = statementValueHash(write.value);
    const nextNode: StatementNode = {
      value: normalizeStatementValue(write.value),
      ...write.statement,
    };
    const withoutSame = existing.filter(
      (node) => statementValueHash(node.value) !== hash,
    );
    parent[stmtKey] = [...withoutSame, nextNode];
  }

  return copy;
}

function remapStatementKeysDeep(
  value: unknown,
  fromSuffix: string,
  toSuffix: string,
): unknown {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) =>
      remapStatementKeysDeep(item, fromSuffix, toSuffix),
    );
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(obj)) {
    const newKey = key.endsWith(fromSuffix)
      ? key.slice(0, -fromSuffix.length) + toSuffix
      : key;
    out[newKey] = remapStatementKeysDeep(fieldValue, fromSuffix, toSuffix);
  }
  return out;
}

function normalizeStatementValuesDeep(value: unknown): unknown {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item != null && typeof item === "object" && "value" in item) {
        const node = item as StatementNode;
        try {
          return { ...node, value: normalizeStatementValue(node.value) };
        } catch {
          return item;
        }
      }
      return normalizeStatementValuesDeep(item);
    });
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(obj)) {
    out[key] = normalizeStatementValuesDeep(fieldValue);
  }
  return out;
}

export function remapStatementsForPersistence<T>(document: T): T {
  return remapStatementKeysDeep(
    document,
    STATEMENT_JSON_SUFFIX,
    STATEMENT_PERSISTENCE_SUFFIX,
  ) as T;
}

export function remapStatementsFromPersistence<T>(document: T): T {
  const remapped = remapStatementKeysDeep(
    document,
    STATEMENT_PERSISTENCE_SUFFIX,
    STATEMENT_JSON_SUFFIX,
  ) as T;
  return normalizeStatementValuesDeep(remapped) as T;
}

function stripStatementKeysDeep(value: unknown): unknown {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map(stripStatementKeysDeep);
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(obj)) {
    if (isStatementKey(key)) continue;
    out[key] = stripStatementKeysDeep(fieldValue);
  }
  return out;
}

export function stripClientStatements<T>(document: T): T {
  return stripStatementKeysDeep(document) as T;
}

function collectFromObject(
  obj: Record<string, unknown>,
  lastSegment: string,
): StatementNode[] {
  const key = `${lastSegment}${STATEMENT_JSON_SUFFIX}`;
  const raw = obj[key];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is StatementNode =>
        item != null && typeof item === "object" && "value" in item,
    )
    .map((item) => ({
      ...item,
      value: normalizeStatementValue(item.value),
    }));
}

export function statementsForPath(
  document: Record<string, unknown>,
  path: string,
): StatementNode[] {
  const segments = path.split(".").filter(Boolean);
  if (segments.length === 0) return [];

  const lastSegment = segments.pop()!;
  let current: unknown = document;

  for (const seg of segments) {
    if (current == null || typeof current !== "object") return [];
    const next = (current as Record<string, unknown>)[seg];
    if (next === undefined) return [];
    if (Array.isArray(next)) {
      return next.flatMap((item) =>
        item != null && typeof item === "object" && !Array.isArray(item)
          ? collectFromObject(item as Record<string, unknown>, lastSegment)
          : [],
      );
    }
    current = next;
  }

  if (
    current == null ||
    typeof current !== "object" ||
    Array.isArray(current)
  ) {
    return [];
  }
  return collectFromObject(current as Record<string, unknown>, lastSegment);
}

export type StatementMetaEncoding =
  | "statement-node"
  | "rdf-12"
  | "side-table"
  | "named-graph"
  | "none";

export function resolveStatementMetaProfile(encoding: StatementMetaEncoding): {
  encoding: StatementMetaEncoding;
} {
  return { encoding };
}

/** Collect all dot paths with policy "always" for a type. */
export function alwaysStatementPathsForType(
  policies: StatementPolicyMap,
  typeName: string,
): string[] {
  const prefix = `${typeName}.`;
  return Object.entries(policies)
    .filter(([key, policy]) => key.startsWith(prefix) && policy === "always")
    .map(([key]) => key.slice(prefix.length));
}
