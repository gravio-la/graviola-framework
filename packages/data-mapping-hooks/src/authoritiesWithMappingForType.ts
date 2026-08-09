import type { NormDataMapping } from "@graviola/edb-core-types";

/**
 * Authority IRIs that declare a mapping table entry for `typeName`.
 */
export function authoritiesWithMappingForType(
  normDataMapping:
    | Record<string, NormDataMapping<Record<string, unknown>>>
    | undefined
    | null,
  typeName: string,
): string[] {
  if (!normDataMapping || !typeName) return [];
  return Object.entries(normDataMapping)
    .filter(([, entry]) => {
      const mapping = entry?.mapping;
      return (
        mapping != null &&
        typeof mapping === "object" &&
        !Array.isArray(mapping) &&
        Object.prototype.hasOwnProperty.call(mapping, typeName)
      );
    })
    .map(([authorityIRI]) => authorityIRI);
}

/** True when any configured authority can map this type. */
export function typeHasAuthorityMappings(
  normDataMapping:
    | Record<string, NormDataMapping<Record<string, unknown>>>
    | undefined
    | null,
  typeName: string,
): boolean {
  return authoritiesWithMappingForType(normDataMapping, typeName).length > 0;
}
