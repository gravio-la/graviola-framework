import { isValidUrl } from "@graviola/edb-core-utils";

/**
 * Expands a property name to a full IRI
 *
 * Handles three cases:
 * 1. Prefixed properties: "dc:title" with context {"dc": "http://purl.org/dc/elements/1.1/"} → "http://purl.org/dc/elements/1.1/title"
 * 2. Full IRIs: "http://example.com/prop" → "http://example.com/prop" (passed through)
 * 3. Local names: "title" with baseIRI "http://schema.org/" → "http://schema.org/title"
 *
 * @param property The property name to expand
 * @param baseIRI The base IRI to use for local names
 * @param context Optional prefix mappings for expansion
 * @returns The expanded property IRI
 *
 * @example
 * ```typescript
 * expandPropertyName("dc:title", "http://schema.org/", {
 *   dc: "http://purl.org/dc/elements/1.1/"
 * }); // → "http://purl.org/dc/elements/1.1/title"
 *
 * expandPropertyName("http://example.com/prop", "http://schema.org/", {});
 * // → "http://example.com/prop"
 *
 * expandPropertyName("name", "http://schema.org/", {});
 * // → "http://schema.org/name"
 * ```
 */
export function expandPropertyName(
  property: string,
  baseIRI: string,
  context?: Record<string, string>,
): string {
  // Check if context is provided and property uses a prefix
  if (context && typeof property === "string") {
    for (const prefix of Object.keys(context)) {
      const prefixPattern = prefix + ":";
      if (property.startsWith(prefixPattern)) {
        const localName = property.substring(prefixPattern.length);
        return context[prefix] + localName;
      }
    }
  }

  // If property is already a full IRI, return as-is
  if (isValidUrl(property)) {
    return property;
  }

  // Otherwise, prepend the base IRI
  return baseIRI + property;
}
