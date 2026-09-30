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
