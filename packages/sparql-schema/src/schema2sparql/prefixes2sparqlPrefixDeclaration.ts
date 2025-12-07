import { Prefixes } from "@graviola/edb-core-types";
import { sparql, type SparqlTemplateResult } from "@tpluscode/sparql-builder";

/**
 * Prefixes that are automatically added by @tpluscode/sparql-builder
 * and should be filtered out to avoid duplication
 */
const AUTO_ADDED_PREFIXES = new Set(["rdf", "xsd"]);
const PREFIX_REGEX = /PREFIX\s+(\w*)\s*:\s*<[^>]+>/gi;

/**
 * Converts a prefix map to a SPARQL template result with PREFIX declarations
 * Deduplicates prefixes by filtering out those that are:
 * - Already declared in an existing query (if provided)
 * - Automatically added by the SPARQL builder (rdf, xsd)
 *
 * @param prefixes - Map of prefix names to namespace URIs
 * @param existingQuery - Optional existing query string to check for already-declared prefixes
 * @returns SparqlTemplateResult with PREFIX declarations for use with .prologue``
 */
export const prefixes2sparqlPrefixDeclaration = (
  prefixes: Prefixes,
  existingQuery?: string,
): SparqlTemplateResult | null => {
  let existingPrefixes = new Set(AUTO_ADDED_PREFIXES);
  if (existingQuery) {
    const matches = existingQuery.matchAll(PREFIX_REGEX);
    for (const match of matches) {
      if (match[1] !== undefined) {
        existingPrefixes.add(match[1]);
      }
    }
  }

  // Build PREFIX declarations, skipping duplicates and auto-added prefixes
  const prefixDeclarations = Object.entries(prefixes)
    .filter(([prefix]) => !existingPrefixes.has(prefix))
    .map(([prefix, uri]) =>
      prefix === ""
        ? sparql`PREFIX : <${uri}>\n`
        : sparql`PREFIX ${prefix}: <${uri}>\n`,
    );

  // Return null if no prefixes to add
  if (prefixDeclarations.length === 0) {
    return null;
  }

  return sparql`${prefixDeclarations}`;
};
