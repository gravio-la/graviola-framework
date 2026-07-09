import type { JSONSchema7 } from "json-schema";
import { cbdBoundaryScopes } from "@graviola/json-schema-utils";

export const META_SCHEMA_IRI = "https://graviola.top/meta/v1";
export const ENTITY_META_DEFINITION = "EntityMeta";
/** JSON/API key for system-asserted entity metadata. */
export const ENTITY_META_JSON_KEY = "$meta";
/** Schema/persistence property key (SPARQL-variable-safe). */
export const ENTITY_META_PERSISTENCE_KEY = "entityMeta";
/** RDF predicate IRI for entity metadata in RDF serializations. */
export const ENTITY_META_PREDICATE_IRI = "https://graviola.top/ns/entityMeta";

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Framework floor profile for system-asserted entity `$meta`. */
export const baseMetaSchemaProfile: JSONSchema7 = {
  $id: META_SCHEMA_IRI,
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
  },
  additionalProperties: false,
};

export type EntityMetaBlock = {
  created?: string;
  modified: string;
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
};

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

/**
 * Graft typed `$meta` onto each CBD (named-entity) boundary in `domainSchema`.
 * Write validation should continue to use the domain artifact only.
 */
export function deriveExtendedSchema(
  domainSchema: JSONSchema7,
  metaSchema: JSONSchema7 = baseMetaSchemaProfile,
  options?: { graftPropertyKey?: string },
): JSONSchema7 {
  const graftKey = options?.graftPropertyKey ?? ENTITY_META_PERSISTENCE_KEY;
  const extended = cloneJson(domainSchema) as JSONSchema7;
  if (!extended.definitions) {
    extended.definitions = {};
  }
  extended.definitions[ENTITY_META_DEFINITION] = cloneJson(metaSchema);
  const metaRef: JSONSchema7 = {
    $ref: `#/definitions/${ENTITY_META_DEFINITION}`,
  };

  for (const { scope } of cbdBoundaryScopes(extended)) {
    graftPropertyAtPointer(extended, scope, graftKey, metaRef);
  }

  return extended;
}

export function documentHasClientMeta(
  document: Record<string, unknown>,
): boolean {
  let found = false;
  walkNamedEntityInstances(document, (entity) => {
    if (entity.$meta !== undefined) {
      found = true;
    }
  });
  return found;
}

/** Strip client-supplied `$meta` at every named entity in the document tree. */
export function stripClientMetaFromDocument<T extends Record<string, unknown>>(
  document: T,
): T {
  const copy = cloneJson(document) as T;
  walkNamedEntityInstances(copy, (entity) => {
    delete entity.$meta;
  });
  return copy;
}

/**
 * Stamp system-asserted `$meta` on every named entity.
 * Preserves `created` from `previousDocument` when present.
 */
export function stampDocumentMeta<T extends Record<string, unknown>>(
  document: T,
  config: MetaStampingConfig,
  previousDocument?: Record<string, unknown> | null,
): T {
  const copy = cloneJson(document) as T;
  const now = config.now?.() ?? new Date().toISOString();
  const previousById = indexNamedEntitiesById(previousDocument);

  walkNamedEntityInstances(copy, (entity) => {
    const entityId = entityIdOf(entity);
    const previousMeta = entityId
      ? (previousById.get(entityId)?.$meta as EntityMetaBlock | undefined)
      : undefined;

    entity.$meta = {
      created: previousMeta?.created ?? now,
      modified: now,
      ...(config.schemaVersion ? { schemaVersion: config.schemaVersion } : {}),
      schemaFingerprint: config.schemaFingerprint,
    } satisfies EntityMetaBlock;
  });

  return copy;
}

export function applyMetaStampingOnWrite<T extends Record<string, unknown>>(
  document: T,
  typeName: string,
  rootSchema: JSONSchema7,
  config: MetaStampingConfig,
  previousDocument?: Record<string, unknown> | null,
): T {
  if (documentHasClientMeta(document)) {
    if (config.rejectClientMeta) {
      throw new Error(
        "Client-supplied $meta is not allowed; $meta is system-asserted only",
      );
    }
  }
  const stripped = stripClientMetaFromDocument(document);
  return stampDocumentMeta(stripped, config, previousDocument);
}

/** Map `$meta` → persistence key before store write. */
export function remapEntityMetaForPersistence<T>(document: T): T {
  const copy = cloneJson(document) as T;
  walkNamedEntityInstances(copy, (entity) => {
    if (entity[ENTITY_META_JSON_KEY] !== undefined) {
      entity[ENTITY_META_PERSISTENCE_KEY] = entity[ENTITY_META_JSON_KEY];
      delete entity[ENTITY_META_JSON_KEY];
    }
  });
  return copy;
}

/** Map persistence key → `$meta` after store read. */
export function remapEntityMetaFromPersistence<T>(document: T): T {
  const copy = cloneJson(document) as T;
  walkNamedEntityInstances(copy, (entity) => {
    const block = entity[ENTITY_META_PERSISTENCE_KEY];
    if (block !== undefined) {
      entity[ENTITY_META_JSON_KEY] = block;
      delete entity[ENTITY_META_PERSISTENCE_KEY];
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

function entityIdOf(entity: Record<string, unknown>): string | undefined {
  const id = entity["@id"] ?? entity.id;
  return typeof id === "string" ? id : undefined;
}

function isNamedEntityInstance(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("@id" in value || "id" in value)
  );
}

function walkNamedEntityInstances(
  value: unknown,
  visit: (entity: Record<string, unknown>) => void,
): void {
  if (!isNamedEntityInstance(value)) return;

  visit(value);

  for (const [key, fieldValue] of Object.entries(value)) {
    if (key === "$meta" || key.startsWith("@")) continue;
    if (fieldValue == null) continue;

    if (Array.isArray(fieldValue)) {
      for (const item of fieldValue) {
        walkNamedEntityInstances(item, visit);
      }
      continue;
    }

    if (typeof fieldValue === "object") {
      walkNamedEntityInstances(fieldValue, visit);
    }
  }
}

function indexNamedEntitiesById(
  document: Record<string, unknown> | null | undefined,
): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  if (!document) return map;

  walkNamedEntityInstances(document, (entity) => {
    const id = entityIdOf(entity);
    if (id) map.set(id, entity);
  });
  return map;
}
