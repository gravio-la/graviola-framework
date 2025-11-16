import { Prefixes } from "@graviola/edb-core-types";

/**
 * Prefixes that are automatically added by @tpluscode/sparql-builder
 * and should be filtered out to avoid duplication
 */
const AUTO_ADDED_PREFIXES = new Set(["rdf", "xsd"]);

/**
 * Converts a prefix map to SPARQL PREFIX declarations
 * Deduplicates prefixes by filtering out those that are:
 * - Already declared in an existing query (if provided)
 * - Automatically added by the SPARQL builder (rdf, xsd)
 *
 * @param prefixes - Map of prefix names to namespace URIs
 * @param existingQuery - Optional existing query string to check for already-declared prefixes
 * @returns SPARQL PREFIX declaration string
 */
export const prefixes2sparqlPrefixDeclaration = (
  prefixes: Prefixes,
  existingQuery?: string,
): string => {
  // Extract already-declared prefixes from existing query if provided
  const existingPrefixes = new Set<string>(AUTO_ADDED_PREFIXES);
  if (existingQuery) {
    const prefixRegex = /PREFIX\s+(\w*)\s*:\s*<[^>]+>/gi;
    let match;
    while ((match = prefixRegex.exec(existingQuery)) !== null) {
      existingPrefixes.add(match[1]); // Capture the prefix name (empty string for default prefix)
    }
  }

  // Build PREFIX declarations, skipping duplicates and auto-added prefixes
  return Object.entries(prefixes)
    .filter(([prefix]) => !existingPrefixes.has(prefix))
    .map(([prefix, uri]) =>
      prefix === "" ? `PREFIX : <${uri}>` : `PREFIX ${prefix}: <${uri}>`,
    )
    .join("\n");
};
