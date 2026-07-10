import type { JSONSchema7 } from "json-schema";
import { resolveSchema } from "./resolver";
import { walkJSONSchema } from "./walkJSONSchema";
import {
  type EntityIdentityOptions,
  schemaHasEntityIdentity,
} from "./entityIdentity";

export type { EntityIdentityOptions } from "./entityIdentity";
export {
  DEFAULT_ENTITY_IDENTITY,
  PRISMA_ENTITY_IDENTITY,
  PRISMA_ENTITY_ID_KEY,
  PRISMA_ENTITY_TYPE_KEY,
  JSONLD_ENTITY_ID_KEY,
  JSONLD_ENTITY_TYPE_KEY,
  entityIdentityFromIdKey,
  resolveEntityIdentityKeys,
  schemaHasEntityIdentity,
  entityIdFromInstance,
  isNamedEntityInstance,
} from "./entityIdentity";

export type CbdBoundaryScope = {
  /** JSON Pointer scope to the sub-schema that starts a named entity. */
  scope: string;
  /** Definition name when scope is under `#/definitions/<Name>`. */
  definitionName?: string;
};

/**
 * Schema-side named-entity (CBD) boundaries.
 *
 * Sub-schemas whose `properties` declare an identity key (default `@id`) are
 * aggregate roots for Concise Bounded Description extraction and `$meta` grafting.
 *
 * Pass the same `identityKeys` as the `idKey` from {@link extendSchemaShortcut}:
 * - SPARQL / JSON-LD: default (`@id`)
 * - Prisma: `{ identityKeys: ["id"] }` or {@link PRISMA_ENTITY_IDENTITY}
 */
export function cbdBoundaryScopes(
  schema: JSONSchema7,
  options?: EntityIdentityOptions,
): CbdBoundaryScope[] {
  const boundaries: CbdBoundaryScope[] = [];
  const visit = (subSchema: JSONSchema7, path: string[]) => {
    walkJSONSchema(subSchema, {
      callbacks: {
        onObject: (objSchema, objPath) => {
          if (schemaHasEntityIdentity(objSchema.properties, options)) {
            const scope = schemaPathToPointer([...path, ...objPath].join("/"));
            const defMatch = scope.match(/^#\/definitions\/([^/]+)/);
            boundaries.push({
              scope,
              definitionName: defMatch?.[1],
            });
          }
        },
      },
    });
  };

  if (schema.definitions) {
    for (const [name, def] of Object.entries(schema.definitions)) {
      if (def && typeof def === "object") {
        visit(def as JSONSchema7, ["definitions", name]);
      }
    }
  } else {
    visit(schema, []);
  }

  return boundaries;
}

/** True when the sub-schema at `scope` is a named-entity (CBD) root. */
export function isNamedEntityBoundaryAtScope(
  schema: JSONSchema7,
  scope: string,
  options?: EntityIdentityOptions,
): boolean {
  const sub = resolveSchema(schema, scope, schema);
  if (!sub || typeof sub !== "object") return false;
  return schemaHasEntityIdentity((sub as JSONSchema7).properties, options);
}

function schemaPathToPointer(schemaPath: string): string {
  if (!schemaPath) return "#";
  const segments = schemaPath.split("/").filter(Boolean);
  return segments.length ? `#/${segments.join("/")}` : "#";
}
