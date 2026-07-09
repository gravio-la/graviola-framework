import type { JSONSchema7 } from "json-schema";
import { isNamedEntityBoundaryAtScope } from "@graviola/json-schema-utils";

export type CbdExtractionOptions = {
  /** Halt recursion into named IRIs when depth > 0 (default true). */
  doNotRecurseNamedNodes?: boolean;
  /** Maximum depth for anonymous structure (undefined = unlimited). */
  maxDepth?: number;
};

/**
 * Whether extraction should halt at a named entity boundary (CBD rule).
 * Mirrors graph-traversal `doNotRecurseNamedNodes` + `@id`-only stub detection.
 */
export function shouldHaltAtNamedEntityBoundary(options: {
  hasNamedIri: boolean;
  depth: number;
  isStubSchema: boolean;
  doNotRecurseNamedNodes?: boolean;
}): boolean {
  const {
    hasNamedIri,
    depth,
    isStubSchema,
    doNotRecurseNamedNodes = true,
  } = options;
  if (isStubSchema) return true;
  if (hasNamedIri && doNotRecurseNamedNodes && depth > 0) return true;
  return false;
}

/** Schema-side stub: only `@id` property declared. */
export function isStubEntitySchema(schema: JSONSchema7): boolean {
  const props = schema.properties;
  if (!props) return false;
  const keys = Object.keys(props);
  return keys.length === 1 && keys[0] === "@id";
}

/**
 * Named CBD boundary check for a schema scope (TBox view).
 */
export function cbdBoundaryOfScope(
  rootSchema: JSONSchema7,
  scope: string,
): boolean {
  return isNamedEntityBoundaryAtScope(rootSchema, scope);
}

export { shouldHaltAtNamedEntityBoundary as extractCBDShouldHalt };
