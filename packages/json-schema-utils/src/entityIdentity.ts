import type { JSONSchema7 } from "json-schema";

/** JSON-LD / SPARQL identity property (default for semantic stores). */
export const JSONLD_ENTITY_ID_KEY = "@id" as const;
/** JSON-LD type property paired with {@link JSONLD_ENTITY_ID_KEY}. */
export const JSONLD_ENTITY_TYPE_KEY = "@type" as const;

/**
 * Prisma / relational persistence identity property.
 * Matches `extendSchemaShortcut(schema, "type", "id")`.
 */
export const PRISMA_ENTITY_ID_KEY = "id" as const;
/** Prisma type column paired with {@link PRISMA_ENTITY_ID_KEY}. */
export const PRISMA_ENTITY_TYPE_KEY = "type" as const;

/**
 * Options for locating named entities in JSON Schema (TBox) or instance data (ABox).
 *
 * **TBox (schema):** a sub-schema whose `properties` declares one of `identityKeys`
 * is a Concise Bounded Description (CBD) root — the unit that receives `$meta` grafts,
 * halts graph extraction, etc.
 *
 * **ABox (instance):** an object carrying one of `identityKeys` is treated as a
 * named entity when walking documents (meta stamping, client-meta rejection, …).
 *
 * Always align `identityKeys` with the `idKey` passed to {@link extendSchemaShortcut}
 * on the same schema artifact. SPARQL backends typically use `@id`; Prisma uses `id`.
 */
export type EntityIdentityOptions = {
  /**
   * Property name(s) that identify a named entity.
   * @default `["@id"]` — JSON-LD / SPARQL default.
   */
  identityKeys?: readonly string[];
};

/** Default identity for JSON-LD-oriented schemas and API documents. */
export const DEFAULT_ENTITY_IDENTITY: EntityIdentityOptions = {
  identityKeys: [JSONLD_ENTITY_ID_KEY],
};

/** Identity options aligned with Prisma `extendSchemaShortcut(..., "type", "id")`. */
export const PRISMA_ENTITY_IDENTITY: EntityIdentityOptions = {
  identityKeys: [PRISMA_ENTITY_ID_KEY],
};

/** Resolve effective identity keys (never empty). */
export function resolveEntityIdentityKeys(
  options?: EntityIdentityOptions,
): readonly string[] {
  const keys = options?.identityKeys;
  if (keys && keys.length > 0) return keys;
  return DEFAULT_ENTITY_IDENTITY.identityKeys!;
}

/**
 * Build {@link EntityIdentityOptions} from the same `idKey` used in
 * `extendSchemaShortcut(schema, typeKey, idKey)`.
 */
export function entityIdentityFromIdKey(
  idKey: string = JSONLD_ENTITY_ID_KEY,
): EntityIdentityOptions {
  return { identityKeys: [idKey] };
}

/** True when `properties` declares at least one configured identity key. */
export function schemaHasEntityIdentity(
  properties: JSONSchema7["properties"] | undefined,
  options?: EntityIdentityOptions,
): boolean {
  if (!properties) return false;
  return resolveEntityIdentityKeys(options).some((key) => key in properties);
}

/** Read the first matching identity value from an instance object. */
export function entityIdFromInstance(
  entity: Record<string, unknown>,
  options?: EntityIdentityOptions,
): string | undefined {
  for (const key of resolveEntityIdentityKeys(options)) {
    const value = entity[key];
    if (typeof value === "string") return value;
  }
  return undefined;
}

/** True when `value` is a plain object carrying a configured identity key. */
export function isNamedEntityInstance(
  value: unknown,
  options?: EntityIdentityOptions,
): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return resolveEntityIdentityKeys(options).some((key) => key in record);
}
