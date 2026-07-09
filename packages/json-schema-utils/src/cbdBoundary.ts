import type { JSONSchema7 } from "json-schema";
import { resolveSchema, type JsonSchema } from "./resolver";
import { walkJSONSchema } from "./walkJSONSchema";

export type CbdBoundaryScope = {
  /** JSON Pointer scope to the sub-schema that starts a named entity (has `@id`). */
  scope: string;
  /** Definition name when scope is under `#/definitions/<Name>`. */
  definitionName?: string;
};

/**
 * Schema-side named-entity (CBD) boundaries: sub-schemas that declare an `@id` property
 * are treated as aggregate roots (Concise Bounded Description units).
 */
export function cbdBoundaryScopes(schema: JSONSchema7): CbdBoundaryScope[] {
  const boundaries: CbdBoundaryScope[] = [];
  const visit = (subSchema: JSONSchema7, path: string[]) => {
    walkJSONSchema(subSchema, {
      callbacks: {
        onObject: (objSchema, objPath) => {
          const props = objSchema.properties;
          if (props && "@id" in props) {
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
): boolean {
  const sub = resolveSchema(schema, scope, schema);
  if (!sub || typeof sub !== "object") return false;
  const props = (sub as JSONSchema7).properties;
  return Boolean(props && "@id" in props);
}

function schemaPathToPointer(schemaPath: string): string {
  if (!schemaPath) return "#";
  const segments = schemaPath.split("/").filter(Boolean);
  return segments.length ? `#/${segments.join("/")}` : "#";
}
