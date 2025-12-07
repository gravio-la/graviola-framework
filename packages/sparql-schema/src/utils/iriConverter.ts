import type { Prefixes } from "@graviola/edb-core-types";
import df from "@rdfjs/data-model";
import type { NamedNode } from "@rdfjs/types";

/**
 * Convert an IRI string to an RDF node, handling both prefixed names and full IRIs
 *
 * This function provides consistent IRI handling across the SPARQL schema package.
 *
 * Logic:
 * - No colon: treat as local name with default prefix (:name)
 * - Has colon: check if prefix is in prefixMap
 *   - If in prefixMap: leave as-is (will be resolved by PREFIX declarations)
 *   - Otherwise: treat as full URL and use df.namedNode
 *
 * @param iri - The IRI string (can be prefixed or full)
 * @param prefixMap - Prefix mappings (e.g., { "schema": "http://schema.org/" })
 * @returns RDF node (either string for prefixed or NamedNode for full IRI)
 *
 * @example
 * ```typescript
 * // No prefix - becomes default prefix
 * convertIRIToNode('name', {}) // Returns: ':name'
 *
 * // Known prefix - left as-is
 * convertIRIToNode('schema:Person', { schema: 'http://schema.org/' }) // Returns: 'schema:Person'
 *
 * // Unknown prefix or full IRI - becomes NamedNode
 * convertIRIToNode('http://example.org/entity', {}) // Returns: NamedNode
 * convertIRIToNode('urn:x121', {}) // Returns: NamedNode
 * ```
 */
export function convertIRIToNode(
  iri: string,
  prefixMap: Prefixes = {},
): string | NamedNode {
  // No colon: treat as local name with default prefix
  if (!iri.includes(":")) {
    return `:${iri}`;
  }

  // Has colon: split to check prefix
  const colonIndex = iri.indexOf(":");
  const prefix = iri.substring(0, colonIndex);

  // Check if prefix is in prefixMap
  if (prefixMap[prefix]) {
    // Prefix is registered, leave as-is (e.g., "schema:Person")
    // SPARQL engine will resolve using PREFIX declarations
    return iri;
  }

  // Prefix not in prefixMap: treat as full URL
  // Examples: urn:x121, http://example.com/entity, https://schema.org/Person
  return df.namedNode(iri);
}
