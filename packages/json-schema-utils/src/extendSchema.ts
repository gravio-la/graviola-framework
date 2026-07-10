import { JSONSchema7 } from "json-schema";

import {
  JSONLD_ENTITY_ID_KEY,
  JSONLD_ENTITY_TYPE_KEY,
  PRISMA_ENTITY_ID_KEY,
  PRISMA_ENTITY_TYPE_KEY,
} from "./entityIdentity";
import { extendDefinitionsWithProperties } from "./stubHelper";

/** Preset keys for JSON-LD / SPARQL schemas (`extendSchemaShortcut` defaults). */
export const JSONLD_SCHEMA_IDENTITY = {
  typeKey: JSONLD_ENTITY_TYPE_KEY,
  idKey: JSONLD_ENTITY_ID_KEY,
} as const;

/** Preset keys for Prisma persistence schemas. */
export const PRISMA_SCHEMA_IDENTITY = {
  typeKey: PRISMA_ENTITY_TYPE_KEY,
  idKey: PRISMA_ENTITY_ID_KEY,
} as const;

/**
 * Extend **every** definition with identity and type properties, and mark
 * both as `required`.
 *
 * Defaults add JSON-LD `@type` and `@id`. For Prisma, pass
 * `PRISMA_SCHEMA_IDENTITY.typeKey` and `.idKey` (or `"type"`, `"id"`).
 *
 * ### Audience: schema authors (framework users), not framework internals
 *
 * This is a **public convenience for application code that hand-authors its
 * JSON Schema**. It implements the convention *"every definition IS a named
 * entity"*: instead of declaring `@id` / `@type` explicitly on each
 * definition, you write plain domain definitions and apply this shortcut once
 * before handing the schema to the framework. Do not confuse it with the
 * lower-level machinery it wraps ({@link extendDefinitionsWithProperties}),
 * which framework code uses with custom property generators and filters.
 *
 * ### When to use it — and when not
 *
 * Use it **only if you author the JSON Schema yourself and intend every
 * definition to be an entity.** Because the extension is applied blanket to
 * all definitions, any definition that was meant as a plain value object
 * (an address block, a quantity-with-unit, a nested config shape, …) is
 * silently promoted to a named entity: it gains a required identity key,
 * becomes a Concise Bounded Description (CBD) root, halts graph extraction
 * at its boundary, and becomes eligible for `$meta` grafting.
 *
 * That makes this shortcut the **wrong tool for schemas you do not 100%
 * control** — anything generated upstream from Zod, LinkML, OpenAPI, or
 * another pipeline. Generated schemas usually mix entity definitions with
 * structural helper definitions, and blanket promotion produces wrong CBD
 * boundaries, spurious required-property validation errors, and entities
 * where none were modeled. For such schemas, either:
 *
 * - let the generator emit identity properties on exactly the definitions
 *   that are entities (preferred — identity stays explicit in the source of
 *   truth), or
 * - call {@link extendDefinitionsWithProperties} directly and exclude
 *   non-entity definitions via `options.excludeSemanticPropertiesForType`.
 *
 * ### Keep identity keys aligned
 *
 * Pair the chosen `idKey` with the same value in
 * {@link entityIdentityFromIdKey} / `deriveExtendedSchema({ identityKeys })`
 * so CBD detection and `$meta` grafting match the schema shape.
 *
 * @param schema - Schema whose `definitions` (or `$defs`) are extended.
 * @param typeKey - Property name for the type discriminator. Default `"@type"`.
 * @param idKey - Property name for the entity identity. Default `"@id"`.
 * @returns A new schema; the input is not mutated.
 */
export const extendSchemaShortcut = (
  schema: any,
  typeKey: string = JSONLD_ENTITY_TYPE_KEY,
  idKey: string = JSONLD_ENTITY_ID_KEY,
): JSONSchema7 => {
  return extendDefinitionsWithProperties(
    schema,
    (_) =>
      ({
        [typeKey]: {
          type: "string",
        },
        [idKey]: {
          type: "string",
        },
      }) as JSONSchema7["properties"],
    (_) => [typeKey, idKey],
  );
};
