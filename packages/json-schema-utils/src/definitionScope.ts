import type { JSONSchema7 } from "json-schema";

/** JSON Schema vocabulary key for the named-definition map. */
export type DefinitionsKey = "definitions" | "$defs";

const DEF_SEGMENT_RE = /\/(?:definitions|\$defs)\/([^/]+)/;

function definitionsKeyOf(
  schemaOrKey: JSONSchema7 | DefinitionsKey,
): DefinitionsKey {
  if (typeof schemaOrKey === "string") return schemaOrKey;
  return "$defs" in schemaOrKey ? "$defs" : "definitions";
}

/**
 * Local definition name from a JSON Pointer / `$ref` / entity scope.
 * Accepts `#/definitions/Plot`, `#/$defs/Plot`, or `#/definitions/Plot/properties/x`.
 */
export function definitionNameFromScope(
  scope: string | undefined | null,
): string | undefined {
  if (!scope) return undefined;
  const match = scope.match(DEF_SEGMENT_RE);
  return match?.[1] || undefined;
}

/**
 * Build an entity (definition-root) scope pointer for `name`.
 * When given a schema, uses that document's definitions key (`$defs` vs `definitions`).
 */
export function definitionScope(
  name: string,
  schemaOrKey: JSONSchema7 | DefinitionsKey = "definitions",
): string {
  const key = definitionsKeyOf(schemaOrKey);
  return `#/${key}/${name}`;
}

/**
 * Property scope under a named definition, e.g.
 * `#/definitions/Plot/properties/billable_area`.
 */
export function definitionPropertyScope(
  definitionName: string,
  propertyName: string,
  schemaOrKey: JSONSchema7 | DefinitionsKey = "definitions",
): string {
  return `${definitionScope(definitionName, schemaOrKey)}/properties/${propertyName}`;
}

/**
 * Definition name from a `$ref` string (`#/definitions/X` or `#/$defs/X`).
 * Falls back to the last path segment for unusual refs.
 */
export function definitionNameFromRef(
  ref: string | undefined | null,
): string | undefined {
  if (!ref) return undefined;
  return definitionNameFromScope(ref) ?? (ref.split("/").pop() || undefined);
}
