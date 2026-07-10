import type { JSONSchema7 } from "json-schema";
import {
  cbdBoundaryScopes,
  type EntityIdentityOptions,
  entityIdFromInstance,
  isNamedEntityInstance,
} from "@graviola/json-schema-utils";

export type { EntityIdentityOptions } from "@graviola/json-schema-utils";

export const META_SCHEMA_IRI = "https://graviola.gra.one/meta/v1";
export const ENTITY_META_DEFINITION = "EntityMeta";
/** JSON/API key for system-asserted entity metadata. */
export const ENTITY_META_JSON_KEY = "$meta";
/** Schema/persistence property key (SPARQL-variable-safe). */
export const ENTITY_META_PERSISTENCE_KEY = "entityMeta";
/** RDF predicate IRI for entity metadata in RDF serializations. */
export const ENTITY_META_PREDICATE_IRI =
  "https://graviola.gra.one/ns/entityMeta";

/** Map JSON/API meta key to persistence-safe property segment. */
export const ENTITY_META_SCOPE_SEGMENT_ALIAS: Readonly<Record<string, string>> =
  {
    [ENTITY_META_JSON_KEY]: ENTITY_META_PERSISTENCE_KEY,
  };

export type LifecycleTimestampMode = "application" | "database-native";

/** Parse `#/properties/a/properties/b` into `["a", "b"]`. */
export function parsePropertyScopeSegments(scope: string): string[] {
  const match = scope.match(/^#\/properties\/(.+)$/);
  if (!match) return [];
  return match[1].split("/properties/").filter(Boolean);
}

export function isMetaAnnotationScope(scope: string): boolean {
  const [root] = parsePropertyScopeSegments(scope);
  return root === ENTITY_META_JSON_KEY || root === ENTITY_META_PERSISTENCE_KEY;
}

/** Map UI scope segments to persistence segments (`$meta` → `entityMeta`). */
export function metaScopeSegmentsToPersistence(segments: string[]): string[] {
  return segments.map(
    (segment) => ENTITY_META_SCOPE_SEGMENT_ALIAS[segment] ?? segment,
  );
}

/** Dot path for JSON-LD row accessors (`#/properties/$meta/properties/created` → `$meta.created`). */
export function metaScopeToAccessorPath(scope: string): string | undefined {
  const segments = parsePropertyScopeSegments(scope);
  if (!segments.length) return undefined;
  return segments
    .map((segment) =>
      segment === ENTITY_META_PERSISTENCE_KEY ? ENTITY_META_JSON_KEY : segment,
    )
    .join(".");
}

/** Flat SPARQL SELECT column id (`entityMeta_modified_single`). */
export function metaScopeToSparqlColumnId(scope: string): string | undefined {
  if (!isMetaAnnotationScope(scope)) return undefined;
  const segments = parsePropertyScopeSegments(scope);
  if (segments.length === 1) {
    return `${segments[0]}_single`;
  }
  const persistenceSegments = metaScopeSegmentsToPersistence(segments);
  return `${persistenceSegments.join("_")}_single`;
}

/** Merge `allOf` meta profile branches into a single object schema for UI dispatch. */
export function flattenMetaSchemaProfile(schema: JSONSchema7): JSONSchema7 {
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

/** Resolve explicit SPARQL ORDER BY variable (without `?` prefix). */
export function resolveMetaSparqlOrderBy(
  scope: string,
  sparqlOrderBy?: string,
): string | undefined {
  if (sparqlOrderBy) return sparqlOrderBy;
  return metaScopeToSparqlColumnId(scope);
}

/** Demand-driven SPARQL SELECT projection for one meta annotation leaf field. */
export type MetaAnnotationProjection = {
  scope: string;
  persistenceSegments: string[];
  sparqlVar: string;
  leafKey: string;
  format?: string;
};

/** Inverse of {@link metaScopeToSparqlColumnId} for leaf meta columns (`entityMeta_modified_single`). */
export function metaSparqlColumnIdToScope(
  columnId: string,
): string | undefined {
  const prefix = `${ENTITY_META_PERSISTENCE_KEY}_`;
  if (!columnId.startsWith(prefix) || !columnId.endsWith("_single")) {
    return undefined;
  }
  const leafKey = columnId.slice(prefix.length, -"_single".length);
  if (!leafKey) return undefined;
  return `#/properties/${ENTITY_META_JSON_KEY}/properties/${leafKey}`;
}

/** Build annotation projections for opt-in flat SELECT fetches. */
export function buildMetaAnnotationProjections(
  metaProfile: JSONSchema7,
  scopes: string[],
): MetaAnnotationProjection[] {
  const flat = flattenMetaSchemaProfile(metaProfile);
  const projections: MetaAnnotationProjection[] = [];
  const seen = new Set<string>();

  for (const scope of scopes) {
    if (!isMetaAnnotationScope(scope)) continue;
    const segments = parsePropertyScopeSegments(scope);
    if (segments.length < 2) continue;

    const sparqlVar = metaScopeToSparqlColumnId(scope);
    if (!sparqlVar || seen.has(sparqlVar)) continue;

    const leafKey = segments[segments.length - 1]!;
    const rawProp = flat.properties?.[leafKey];
    const format =
      rawProp &&
      typeof rawProp === "object" &&
      !Array.isArray(rawProp) &&
      typeof (rawProp as JSONSchema7).format === "string"
        ? (rawProp as JSONSchema7).format
        : undefined;

    seen.add(sparqlVar);
    projections.push({
      scope,
      persistenceSegments: metaScopeSegmentsToPersistence(segments),
      sparqlVar,
      leafKey,
      ...(format ? { format } : {}),
    });
  }

  return projections;
}

/** Merge explicit annotation scopes with scopes implied by SPARQL sort column ids. */
export function mergeMetaAnnotationScopes(
  scopes: string[] | undefined,
  sortingColumnIds: string[] | undefined,
): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const scope of scopes ?? []) {
    if (seen.has(scope)) continue;
    seen.add(scope);
    merged.push(scope);
  }

  for (const columnId of sortingColumnIds ?? []) {
    const scope = metaSparqlColumnIdToScope(columnId);
    if (!scope || seen.has(scope)) continue;
    seen.add(scope);
    merged.push(scope);
  }

  return merged;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Lifecycle slice of `$meta` (dct:created / dct:modified). */
export const lifecycleMetaSchemaFragment: JSONSchema7 = {
  type: "object",
  properties: {
    created: {
      type: "string",
      format: "date-time",
      description: "dct:created",
    },
    modified: {
      type: "string",
      format: "date-time",
      description: "dct:modified",
    },
  },
  additionalProperties: false,
};

const fingerprintAndProvenanceProperties: JSONSchema7["properties"] = {
  schemaVersion: {
    type: "string",
    description: "gra:schemaVersion",
  },
  schemaFingerprint: {
    type: "string",
    description: "gra:schemaFingerprint",
  },
  provenance: {
    type: "object",
    properties: {
      generatedAt: { type: "string", format: "date-time" },
      agent: { type: "string" },
      formulaId: { type: "string" },
      lensId: { type: "string" },
    },
    additionalProperties: false,
  },
};

/** Compose the framework meta profile; lifecycle fields are optional. */
export function composeMetaSchemaProfile(options?: {
  includeLifecycle?: boolean;
}): JSONSchema7 {
  const properties: JSONSchema7["properties"] = {
    ...cloneJson(fingerprintAndProvenanceProperties),
  };
  if (options?.includeLifecycle) {
    Object.assign(
      properties,
      cloneJson(lifecycleMetaSchemaFragment.properties),
    );
  }
  return {
    $id: META_SCHEMA_IRI,
    type: "object",
    properties,
    additionalProperties: false,
  };
}

/** Framework floor profile with lifecycle (backward-compatible default shape). */
export const baseMetaSchemaProfile: JSONSchema7 = composeMetaSchemaProfile({
  includeLifecycle: true,
});

export type EntityMetaBlock = {
  created?: string;
  modified?: string;
  schemaVersion?: string;
  schemaFingerprint: string;
  provenance?: {
    generatedAt?: string;
    agent?: string;
    formulaId?: string;
    lensId?: string;
  };
};

export type MetaStampingConfig = {
  schemaVersion?: string;
  schemaFingerprint: string;
  metaSchemaVersion?: string;
  /** When true, upsert rejects documents that carry client `$meta`. */
  rejectClientMeta?: boolean;
  /** Injectable clock for tests. */
  now?: () => string;
  /**
   * Instance property keys that identify a named entity when stamping.
   * Default: `@id` (JSON-LD API shape). Use `["id"]` only when stamping
   * documents that have not yet been mapped to JSON-LD keys.
   */
  identityKeys?: readonly string[];
  /**
   * When omitted or false: do not record created/modified.
   * `application`: store layer stamps on write (SPARQL default).
   * `database-native`: Prisma `@default(now())` / `@updatedAt` (no app stamp on write).
   */
  lifecycleTimestamps?: false | LifecycleTimestampMode;
};

export function lifecycleTimestampsEnabled(
  config: MetaStampingConfig,
): boolean {
  return (
    config.lifecycleTimestamps === "application" ||
    config.lifecycleTimestamps === "database-native"
  );
}

export function shouldApplicationStampLifecycle(
  config: MetaStampingConfig,
): boolean {
  return config.lifecycleTimestamps === "application";
}

/** Meta schema grafted at CBD boundaries for a stamping configuration. */
export function deriveMetaProfileForStamping(
  config: MetaStampingConfig,
): JSONSchema7 {
  return composeMetaSchemaProfile({
    includeLifecycle: lifecycleTimestampsEnabled(config),
  });
}

export function resolveLifecycleDescriptorMode(
  config: MetaStampingConfig,
): false | "application" | "database-native" {
  if (!lifecycleTimestampsEnabled(config)) return false;
  return config.lifecycleTimestamps === "database-native"
    ? "database-native"
    : "application";
}

/** Default lifecycle mode for Prisma when `lifecycleTimestamps` is omitted. */
export function defaultPrismaLifecycleMode(
  datasourceProvider: string,
): LifecycleTimestampMode {
  return datasourceProvider.toLowerCase() === "mongodb"
    ? "application"
    : "database-native";
}

export function resolvePrismaMetaStamping(
  config: MetaStampingConfig,
  datasourceProvider: string,
): MetaStampingConfig {
  return {
    ...config,
    lifecycleTimestamps:
      config.lifecycleTimestamps ??
      defaultPrismaLifecycleMode(datasourceProvider),
  };
}

export function resolveSparqlMetaStamping(
  config: MetaStampingConfig,
): MetaStampingConfig {
  let lifecycle = config.lifecycleTimestamps ?? "application";
  if (lifecycle === "database-native") {
    lifecycle = "application";
  }
  return {
    ...config,
    lifecycleTimestamps: lifecycle,
  };
}

/** Descriptor lifecycle mode; SPARQL downgrades database-native to application. */
export function resolveEntityMetaProfile(
  config: MetaStampingConfig,
  encoding: "named-graph" | "triples" | "column" | "pipeline",
  backend: "prisma" | "sparql",
): {
  encoding: typeof encoding;
  lifecycleTimestamps?: false | "application" | "database-native";
} {
  let lifecycle = resolveLifecycleDescriptorMode(config);
  if (backend === "sparql" && lifecycle === "database-native") {
    lifecycle = "application";
  }
  return lifecycle === false
    ? { encoding, lifecycleTimestamps: false }
    : { encoding, lifecycleTimestamps: lifecycle };
}

/**
 * Compose a MetaSchema profile via `allOf` (application extensions).
 * Extension fields should declare IRI mappings in their own `@context` when persisted.
 */
export function extendMetaSchema(
  base: JSONSchema7,
  extension: JSONSchema7,
): JSONSchema7 {
  return {
    allOf: [cloneJson(base), cloneJson(extension)],
  };
}

export type DeriveExtendedSchemaOptions = EntityIdentityOptions & {
  graftPropertyKey?: string;
  inlineMetaSchema?: boolean;
  /** Graft lifecycle fields on `$meta` / entityMeta. Default false. */
  includeLifecycle?: boolean;
};

export function deriveExtendedSchema(
  domainSchema: JSONSchema7,
  metaSchema?: JSONSchema7,
  options?: DeriveExtendedSchemaOptions,
): JSONSchema7 {
  const effectiveMetaSchema =
    metaSchema ??
    composeMetaSchemaProfile({
      includeLifecycle: options?.includeLifecycle ?? false,
    });
  const graftKey = options?.graftPropertyKey ?? ENTITY_META_PERSISTENCE_KEY;
  const extended = cloneJson(domainSchema) as JSONSchema7;
  if (!extended.definitions) {
    extended.definitions = {};
  }

  const normalizedMetaSchema = flattenMetaSchemaProfile(
    cloneJson(effectiveMetaSchema),
  );
  const metaPropSchema: JSONSchema7 = options?.inlineMetaSchema
    ? normalizedMetaSchema
    : (() => {
        extended.definitions[ENTITY_META_DEFINITION] = normalizedMetaSchema;
        return {
          $ref: `#/definitions/${ENTITY_META_DEFINITION}`,
        };
      })();

  for (const { scope } of cbdBoundaryScopes(extended, options)) {
    graftPropertyAtPointer(extended, scope, graftKey, metaPropSchema);
  }

  return extended;
}

export function documentHasClientMeta(
  document: Record<string, unknown>,
  identity?: EntityIdentityOptions,
): boolean {
  let found = false;
  walkNamedEntityInstances(
    document,
    (entity) => {
      if (entity.$meta !== undefined) {
        found = true;
      }
    },
    identity,
  );
  return found;
}

export function stripClientMetaFromDocument<T extends Record<string, unknown>>(
  document: T,
  identity?: EntityIdentityOptions,
): T {
  const copy = cloneJson(document) as T;
  walkNamedEntityInstances(
    copy,
    (entity) => {
      delete entity.$meta;
    },
    identity,
  );
  return copy;
}

export function stampDocumentMeta<T extends Record<string, unknown>>(
  document: T,
  config: MetaStampingConfig,
  previousDocument?: Record<string, unknown> | null,
): T {
  const copy = cloneJson(document) as T;
  const now = config.now?.() ?? new Date().toISOString();
  const identity = metaStampingIdentity(config);
  const previousById = indexNamedEntitiesById(previousDocument, identity);
  const stampLifecycle = shouldApplicationStampLifecycle(config);

  walkNamedEntityInstances(
    copy,
    (entity) => {
      const entityId = entityIdFromInstance(entity, identity);
      const previousMeta = entityId
        ? (previousById.get(entityId)?.$meta as EntityMetaBlock | undefined)
        : undefined;

      const block: EntityMetaBlock = {
        schemaFingerprint: config.schemaFingerprint,
        ...(config.schemaVersion
          ? { schemaVersion: config.schemaVersion }
          : {}),
      };

      if (stampLifecycle) {
        block.created = previousMeta?.created ?? now;
        block.modified = now;
      }

      entity.$meta = block;
    },
    identity,
  );

  return copy;
}

export function applyMetaStampingOnWrite<T extends Record<string, unknown>>(
  document: T,
  _typeName: string,
  _rootSchema: JSONSchema7,
  config: MetaStampingConfig,
  previousDocument?: Record<string, unknown> | null,
): T {
  const identity = metaStampingIdentity(config);
  if (documentHasClientMeta(document, identity)) {
    if (config.rejectClientMeta) {
      throw new Error(
        "Client-supplied $meta is not allowed; $meta is system-asserted only",
      );
    }
  }
  const stripped = stripClientMetaFromDocument(document, identity);
  return stampDocumentMeta(stripped, config, previousDocument);
}

/** Map `$meta` → persistence key before store write. */
export function remapEntityMetaForPersistence<T>(
  document: T,
  identity?: EntityIdentityOptions,
): T {
  const copy = cloneJson(document) as T;
  walkNamedEntityInstances(
    copy,
    (entity) => {
      if (entity[ENTITY_META_JSON_KEY] !== undefined) {
        entity[ENTITY_META_PERSISTENCE_KEY] = entity[ENTITY_META_JSON_KEY];
        delete entity[ENTITY_META_JSON_KEY];
      }
    },
    identity,
  );
  return copy;
}

/** Map persistence key → `$meta` after store read. */
export function remapEntityMetaFromPersistence<T>(
  document: T,
  identity?: EntityIdentityOptions,
): T {
  const copy = cloneJson(document) as T;
  walkNamedEntityInstances(
    copy,
    (entity) => {
      const block = entity[ENTITY_META_PERSISTENCE_KEY];
      if (block !== undefined) {
        entity[ENTITY_META_JSON_KEY] = block;
        delete entity[ENTITY_META_PERSISTENCE_KEY];
      }
    },
    identity,
  );
  return copy;
}

/** Strip lifecycle keys from entityMeta before native DB write. */
export function stripLifecycleFromPersistenceMeta<T>(document: T): T {
  const copy = cloneJson(document) as T;
  walkNamedEntityInstances(copy, (entity) => {
    const block = entity[ENTITY_META_PERSISTENCE_KEY] as
      | Record<string, unknown>
      | undefined;
    if (block && typeof block === "object") {
      delete block.created;
      delete block.modified;
    }
    const jsonBlock = entity[ENTITY_META_JSON_KEY] as
      | Record<string, unknown>
      | undefined;
    if (jsonBlock && typeof jsonBlock === "object") {
      delete jsonBlock.created;
      delete jsonBlock.modified;
    }
  });
  return copy;
}

function graftPropertyAtPointer(
  schema: JSONSchema7,
  pointer: string,
  propName: string,
  propSchema: JSONSchema7,
): void {
  const segments = pointer.replace(/^#\//, "").split("/").filter(Boolean);
  if (segments.length === 0) return;

  let current: Record<string, unknown> = schema as Record<string, unknown>;
  for (const segment of segments) {
    const next = current[segment];
    if (!next || typeof next !== "object") return;
    current = next as Record<string, unknown>;
  }

  if (current.type !== "object") return;
  const properties = (current.properties ?? {}) as Record<string, JSONSchema7>;
  current.properties = {
    ...properties,
    [propName]: cloneJson(propSchema),
  };
}

function metaStampingIdentity(
  config: MetaStampingConfig,
): EntityIdentityOptions | undefined {
  return config.identityKeys
    ? { identityKeys: config.identityKeys }
    : undefined;
}

function walkNamedEntityInstances(
  value: unknown,
  visit: (entity: Record<string, unknown>) => void,
  identity?: EntityIdentityOptions,
): void {
  if (!isNamedEntityInstance(value, identity)) return;

  visit(value);

  for (const [key, fieldValue] of Object.entries(value)) {
    if (key === "$meta" || key.startsWith("@")) continue;
    if (fieldValue == null) continue;

    if (Array.isArray(fieldValue)) {
      for (const item of fieldValue) {
        walkNamedEntityInstances(item, visit, identity);
      }
      continue;
    }

    if (typeof fieldValue === "object") {
      walkNamedEntityInstances(fieldValue, visit, identity);
    }
  }
}

function indexNamedEntitiesById(
  document: Record<string, unknown> | null | undefined,
  identity?: EntityIdentityOptions,
): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  if (!document) return map;

  walkNamedEntityInstances(
    document,
    (entity) => {
      const id = entityIdFromInstance(entity, identity);
      if (id) map.set(id, entity);
    },
    identity,
  );
  return map;
}
