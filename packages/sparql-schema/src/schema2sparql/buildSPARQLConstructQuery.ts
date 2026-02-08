import type { Prefixes } from "@graviola/edb-core-types";
import { CONSTRUCT } from "@tpluscode/sparql-builder";
import type { ConstructResult } from "./normalizedSchema2construct";
import { prefixes2sparqlPrefixDeclaration } from "./prefixes2sparqlPrefixDeclaration";

/**
 * Builds a complete SPARQL CONSTRUCT query from normalized schema results
 *
 * Uses @tpluscode/sparql-builder to ensure proper query structure with:
 * - PREFIX declarations at the top level (deduplicated)
 * - CONSTRUCT clause with all patterns
 * - WHERE clause with all patterns (including SUBSELECTs)
 *
 * @param constructResult - Result from normalizedSchema2construct
 * @param prefixMap - Optional prefix mappings for the query
 * @returns Complete SPARQL query string
 *
 * @example
 * ```typescript
 * const result = normalizedSchema2construct(iri, typeIRIs, schema, { prefixMap });
 * const query = buildSPARQLConstructQuery(result, prefixMap);
 * // Execute query against triple store
 * ```
 */
export function buildSPARQLConstructQuery(
  constructResult: ConstructResult,
  prefixMap?: Prefixes,
): string {
  const { constructPatterns, wherePatterns } = constructResult;

  let query = CONSTRUCT`${constructPatterns}`.WHERE`${wherePatterns}`;

  if (prefixMap) {
    const prefixDecls = prefixes2sparqlPrefixDeclaration(prefixMap);

    if (prefixDecls) {
      // Use prologue to add PREFIX declarations at the top
      query = query.prologue`${prefixDecls}`;
    }
  }

  return query.build().toString();
}

/**
 * Alias for backward compatibility
 */
export const constructResultToSPARQL = buildSPARQLConstructQuery;
